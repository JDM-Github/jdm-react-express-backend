import "dotenv/config";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url"
import { readdirSync } from "fs";
import ManagerDatabase from "./managers/database.manager.js";
import { ModelTemplate } from "./templates/model.template.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const mode = args[0]; // "fresh" | "alter"
const env = args[1];  // "dev" | "prod" | "dep"

const VALID_MODES = ["fresh", "alter"];
const ENV_MAP: Record<string, string> = {
    dev: "development",
    prod: "production",
    dep: "deployed",
};

if (!mode || !VALID_MODES.includes(mode)) {
    console.error(`
[Migration] Error: missing or invalid mode.

Usage:
  npx tsx src/migration.ts <mode> [env]

Modes:
  fresh   — drops and recreates all tables (destructive)
  alter   — syncs schema without dropping data

Envs (optional, defaults to dev):
  dev     — development
  prod    — production
  dep     — deployed

Examples:
  npx tsx src/migration.ts fresh
  npx tsx src/migration.ts alter dev
  npx tsx src/migration.ts fresh prod
`);
    process.exit(1);
}

const resolvedEnv = ENV_MAP[env ?? "dev"] ?? "development";
process.env["MODE"] = resolvedEnv;

const TARGET = (process.env["TARGET_DATABASE"] ?? "psql") as "psql" | "sql" | "mongo" | "supabase" | "prisma";
const force = mode === "fresh";
console.log(`[Migration] mode=${mode} | env=${resolvedEnv} | driver=${TARGET}`);

async function loadModels(): Promise<void> {
    const modelsDir = path.join(__dirname, "models");

    let files: string[];
    try {
        files = readdirSync(modelsDir)
            .filter((f) => f.endsWith(".js") || f.endsWith(".ts"));
    } catch {
        console.warn("[Migration] No models folder found at src/models/ — nothing to sync.");
        return;
    }

    if (files.length === 0) {
        console.warn("[Migration] No model files found.");
        return;
    }

    for (const file of files) {
        const filePath = path.join(modelsDir, file);
        const fileUrl = pathToFileURL(filePath).href;
        const mod = await import(fileUrl) as Record<string, unknown>;

        for (const exported of Object.values(mod)) {
            if (
                typeof exported === "function" &&
                exported.prototype instanceof ModelTemplate
            ) {
                const ModelClass = exported as new () => ModelTemplate;

                ManagerDatabase.registerModel(TARGET, ModelClass);   // ← actually register

                const instance = new ModelClass();
                console.log(`[Migration] Loaded model: ${instance.table}`);
            }
        }
    }
}

async function run(): Promise<void> {
    try {
        await ManagerDatabase.connect(TARGET);
        await loadModels();
        await ManagerDatabase.syncModels(TARGET, force);
        console.log(`[Migration] Done.`);
    } catch (err) {
        console.error("[Migration] Failed:", err);
        process.exit(1);
    } finally {
        await ManagerDatabase.disconnect(TARGET);
    }
}

run();