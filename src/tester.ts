import "dotenv/config";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { readdirSync } from "fs";
import ManagerDatabase from "./managers/database.manager.js";
import { ModelTemplate } from "./templates/model.template.js";
import { DatabaseDriver } from "./managers/database.manager.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Args ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const env = args[0];

const ENV_MAP: Record<string, string> = {
    dev: "development",
    prod: "production",
    dep: "deployed",
    elec: "electron",
};

const resolvedEnv = ENV_MAP[env ?? "dev"] ?? "development";
process.env["MODE"] = resolvedEnv;

const TARGET = (process.env["TARGET_DATABASE"] ?? "psql") as DatabaseDriver;

console.log(`[Tester] env=${resolvedEnv} | driver=${TARGET}\n`);

// ── Load all models ───────────────────────────────────────────────────────────

type ModelConstructor = new () => ModelTemplate;

async function loadModels(): Promise<ModelConstructor[]> {
    const modelsDir = path.join(__dirname, "models");

    let files: string[];
    try {
        files = readdirSync(modelsDir)
            .filter((f) => f.endsWith(".js") || f.endsWith(".ts"))
            .sort();
    } catch {
        console.warn("[Tester] No models folder found at src/models/");
        return [];
    }

    const models: ModelConstructor[] = [];

    for (const file of files) {
        const filePath = path.join(modelsDir, file);
        const fileUrl = pathToFileURL(filePath).href; 
        const mod = await import(fileUrl) as Record<string, unknown>;

        for (const exported of Object.values(mod)) {
            if (
                typeof exported === "function" &&
                exported.prototype instanceof ModelTemplate
            ) {
                const ModelClass = exported as ModelConstructor;
                ManagerDatabase.registerModel(TARGET, ModelClass);
                models.push(ModelClass);
            }
        }
    }

    return models;
}

// ── Run ───────────────────────────────────────────────────────────────────────

async function run(): Promise<void> {
    try {
        await ManagerDatabase.connect(TARGET);

        const models = await loadModels();

        if (models.length === 0) {
            console.warn("[Tester] No models found. Nothing to fetch.");
            return;
        }

        for (const ModelClass of models) {
            const instance = new ModelClass();
            const tableName = instance.table;

            console.log(`\n┌─ ${tableName} ${"─".repeat(Math.max(0, 40 - tableName.length))}`);

            const result = await ManagerDatabase
                .fetch(TARGET, ModelClass)
                .all();

            if (result.error) {
                console.error(`│  Error: ${result.error}`);
            } else if (!result.data || result.data.length === 0) {
                console.log(`│  (empty — no records found)`);
            } else {
                console.log(`│  count: ${result.count}`);
                console.log(`│  data:`);
                for (const row of result.data) {
                    console.log(`│    ${JSON.stringify(row)}`);
                }
            }

            console.log(`└${"─".repeat(42)}`);
        }

        console.log("\n[Tester] Done.");
    } catch (err) {
        console.error("[Tester] Failed:", err);
        process.exit(1);
    } finally {
        await ManagerDatabase.disconnect(TARGET);
    }
}

run();