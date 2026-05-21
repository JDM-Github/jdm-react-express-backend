import "dotenv/config";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { readdirSync } from "fs";
import ManagerDatabase from "./managers/database.manager.js";
import { DatabaseDriver } from "./managers/database.manager.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Args ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const mode = args[0];
const env = args[1];

const VALID_MODES = ["run", "fresh", "undo"]; 

const ENV_MAP: Record<string, string> = {
    dev: "development",
    prod: "production",
    dep: "deployed",
};

if (!mode || !VALID_MODES.includes(mode)) {
    console.error(`
[Seeder] Error: missing or invalid mode.

Usage:
  npx tsx src/seeder.ts <mode> [env]

Modes:
  run     — inserts seed data (skips if already exists)
  fresh   — clears table first, then inserts seed data
  undo    — removes seeded records from all tables

Envs (optional, defaults to dev):
  dev     — development
  prod    — production
  dep     — deployed

Examples:
  npx tsx src/seeder.ts run
  npx tsx src/seeder.ts fresh dev
  npx tsx src/seeder.ts undo dev
`);
    process.exit(1);
}

const resolvedEnv = ENV_MAP[env ?? "dev"] ?? "development";
process.env["MODE"] = resolvedEnv;

const TARGET = (process.env["TARGET_DATABASE"] ?? "psql") as DatabaseDriver;
const isFresh = mode === "fresh";
const isUndo = mode === "undo";

console.log(`[Seeder] mode=${mode} | env=${resolvedEnv} | driver=${TARGET}`);

// ── Seeder interface ──────────────────────────────────────────────────────────

export abstract class SeederTemplate {
    abstract run(driver: DatabaseDriver, fresh: boolean): Promise<void>;
    abstract undo(driver: DatabaseDriver): Promise<void>;
}

// ── Loader ────────────────────────────────────────────────────────────────────

async function loadSeeders(): Promise<SeederTemplate[]> {
    const seedersDir = path.join(__dirname, "seeds");

    let files: string[];
    try {
        files = readdirSync(seedersDir)
            .filter((f) => f.endsWith(".js") || f.endsWith(".ts"))
            .sort();
    } catch {
        console.warn("[Seeder] No seed folder found at src/seeds/ — nothing to run.");
        return [];
    }

    if (files.length === 0) {
        console.warn("[Seeder] No seed files found.");
        return [];
    }

    const seeders: SeederTemplate[] = [];

    for (const file of files) {
        const filePath = path.join(seedersDir, file);
        const fileUrl = pathToFileURL(filePath).href;
        const mod = await import(fileUrl) as Record<string, unknown>;

        for (const exported of Object.values(mod)) {
            if (
                typeof exported === "function" &&
                exported.prototype instanceof SeederTemplate
            ) {
                seeders.push(new (exported as new () => SeederTemplate)());
                console.log(`[Seeder] Loaded: ${file}`);
            }
        }
    }

    return seeders;
}

// ── Run ───────────────────────────────────────────────────────────────────────

async function run(): Promise<void> {
    try {
        await ManagerDatabase.connect(TARGET);

        const seeders = await loadSeeders();

        if (isUndo) {
            for (const seeder of [...seeders].reverse()) {
                await seeder.undo(TARGET);
            }
        } else {
            for (const seeder of seeders) {
                await seeder.run(TARGET, isFresh);
            }
        }

        console.log("[Seeder] Done.");
    } catch (err) {
        console.error("[Seeder] Failed:", err);
        process.exit(1);
    } finally {
        await ManagerDatabase.disconnect(TARGET);
    }
}

run();