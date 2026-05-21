import { DatabaseTemplate, FetchBuilder, QueryBuilder, QueryResult, SingleResult } from "../templates/database.template.js";
import { ManagerTemplate } from "../templates/manager.template.js";
import { DataOf, ModelTemplate } from "../templates/model.template.js";
import { PSQLDatabase } from "./databases/psql.database.js";

export type DatabaseDriver = "psql" | "sql" | "mongo" | "supabase" | "prisma";

class DatabaseManager extends ManagerTemplate<DatabaseDriver, DatabaseTemplate> {
    protected label = "DatabaseManager";

    constructor() {
        super();
        this.drivers.set("psql", new PSQLDatabase());
    }

    fetch<T extends ModelTemplate<any>>(driver: DatabaseDriver, ModelClass: new () => T): FetchBuilder<DataOf<T>> {
        return this.resolveSync(driver).fetch(ModelClass) as FetchBuilder<DataOf<T>>;
    }

    query(driver: DatabaseDriver, sql: string, params?: unknown[]): QueryBuilder {
        return this.resolveSync(driver).query(sql, params);
    }

    async registerModel<T extends object>(driver: DatabaseDriver, ModelClass: new () => T): Promise<void> {
        return (await this.resolve(driver)).registerModel(ModelClass);
    }

    async syncModels(driver: DatabaseDriver, force = false): Promise<void> {
        return (await this.resolve(driver)).syncModels(force);
    }

    async insert<T extends object, D extends object>(driver: DatabaseDriver, ModelClass: new () => T, data: D): Promise<SingleResult<D>> {
        return (await this.resolve(driver)).insert(ModelClass, data as unknown as Partial<T>) as unknown as Promise<SingleResult<D>>;
    }

    async update<T extends object, D extends object>(driver: DatabaseDriver, ModelClass: new () => T, conditions: Partial<D>, data: Partial<D>): Promise<QueryResult<D>> {
        return (await this.resolve(driver)).update(ModelClass, conditions as unknown as Partial<T>, data as unknown as Partial<T>) as unknown as Promise<QueryResult<D>>;
    }

    async remove<T extends object, D extends object>(driver: DatabaseDriver, ModelClass: new () => T, conditions: Partial<D>): Promise<QueryResult<D>> {
        return (await this.resolve(driver)).remove(ModelClass, conditions as unknown as Partial<T>) as unknown as Promise<QueryResult<D>>;
    }
}

export default new DatabaseManager();