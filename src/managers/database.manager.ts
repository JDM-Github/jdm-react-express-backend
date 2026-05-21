import { DatabaseTemplate, FetchBuilder, QueryBuilder, QueryResult, SingleResult } from "../templates/database.template.js";
import { DataOf, ModelTemplate } from "../templates/model.template.js";
import { PSQLDatabase } from "./databases/psql.database.js";

export type DatabaseDriver = "psql" | "sql" | "mongo" | "supabase" | "prisma";

class DatabaseManager {
    private drivers: Map<DatabaseDriver, DatabaseTemplate> = new Map();

    constructor() {
        this.drivers.set("psql", new PSQLDatabase());
        // this.drivers.set("sql",      new SQLDatabase());
        // this.drivers.set("mongo",    new MongoDatabase());
        // this.drivers.set("supabase", new SupabaseDatabase());
        // this.drivers.set("prisma",   new PrismaDatabase());
    }

    private async resolve(driver: DatabaseDriver): Promise<DatabaseTemplate> {
        const db = this.drivers.get(driver);
        if (!db) throw new Error(`[DatabaseManager] Unknown driver: "${driver}"`);
        if (!db.isConnected()) {
            console.warn(`[DatabaseManager] Driver "${driver}" not connected. Reconnecting...`);
            await db.connect();
        }
        return db;
    }

    async connect(driver: DatabaseDriver): Promise<void> {
        const db = this.drivers.get(driver);
        if (!db) throw new Error(`[DatabaseManager] Unknown driver: "${driver}"`);
        await db.connect();
    }

    async connectAll(): Promise<void> {
        for (const [name, db] of this.drivers) {
            try {
                await db.connect();
            } catch (err) {
                console.warn(`[DatabaseManager] Could not connect "${name}":`, err);
            }
        }
    }

    async disconnect(driver: DatabaseDriver): Promise<void> {
        await this.drivers.get(driver)?.disconnect();
    }

    async disconnectAll(): Promise<void> {
        for (const db of this.drivers.values()) {
            await db.disconnect();
        }
    }

    async registerModel<T extends object>(driver: DatabaseDriver, ModelClass: new () => T): Promise<void> {
        const db = await this.resolve(driver);
        await db.registerModel(ModelClass);
    }

    async syncModels(driver: DatabaseDriver, force = false): Promise<void> {
        const db = await this.resolve(driver);
        await db.syncModels(force);
    }

    fetch<T extends ModelTemplate<any>>(
        driver: DatabaseDriver,
        ModelClass: new () => T
    ): FetchBuilder<DataOf<T>> {
        const db = this.drivers.get(driver);
        if (!db) throw new Error(`[DatabaseManager] Unknown driver: "${driver}"`);
        if (!db.isConnected()) throw new Error(`[DatabaseManager] Driver "${driver}" is not connected.`);
        return db.fetch(ModelClass) as FetchBuilder<DataOf<T>>;
    }

    query(driver: DatabaseDriver, sql: string, params?: unknown[]): QueryBuilder {
        const db = this.drivers.get(driver);
        if (!db) throw new Error(`[DatabaseManager] Unknown driver: "${driver}"`);
        if (!db.isConnected()) throw new Error(`[DatabaseManager] Driver "${driver}" is not connected.`);
        return db.query(sql, params);
    }

    async insert<T extends object, D extends object>(driver: DatabaseDriver, ModelClass: new () => T, data: D): Promise<SingleResult<D>> {
        const db = await this.resolve(driver);
        return db.insert(ModelClass, data as unknown as Partial<T>) as unknown as Promise<SingleResult<D>>;
    }

    async update<T extends object, D extends object>(driver: DatabaseDriver, ModelClass: new () => T, conditions: Partial<D>, data: Partial<D>): Promise<QueryResult<D>> {
        const db = await this.resolve(driver);
        return db.update(ModelClass, conditions as unknown as Partial<T>, data as unknown as Partial<T>) as unknown as Promise<QueryResult<D>>;
    }

    async remove<T extends object, D extends object>(driver: DatabaseDriver, ModelClass: new () => T, conditions: Partial<D>): Promise<QueryResult<D>> {
        const db = await this.resolve(driver);
        return db.remove(ModelClass, conditions as unknown as Partial<T>) as unknown as Promise<QueryResult<D>>;
    }
}

export default new DatabaseManager();