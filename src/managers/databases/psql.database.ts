import Config from "../../configs/env.config.js";
import { Sequelize, DataTypes, Model, ModelStatic, ModelAttributeColumnOptions, ModelAttributes } from "sequelize";
import {
    DatabaseTemplate,
    FetchBuilder,
    QueryBuilder,
    QueryResult,
    SingleResult,
} from "../../templates/database.template.js";
import { DataOf, ModelTemplate } from "../../templates/model.template.js";

class PSQLFetchBuilder<T extends object> implements FetchBuilder<T> {
    private sequelizeModel: ModelStatic<Model>;
    private conditions: Partial<T> = {};
    private sortOrder: "ASC" | "DESC" = "ASC";
    private sortCol: string | undefined;
    private limitVal: number | undefined;

    constructor(sequelizeModel: ModelStatic<Model>) {
        this.sequelizeModel = sequelizeModel;
    }

    where(conditions: Partial<T>): this {
        this.conditions = { ...this.conditions, ...conditions };
        return this;
    }

    sort(order: "asc" | "desc", column?: string): this {
        this.sortOrder = order.toUpperCase() as "ASC" | "DESC";
        this.sortCol = column;
        return this;
    }

    limit(n: number): this {
        this.limitVal = n;
        return this;
    }

    async all(): Promise<QueryResult<T>> {
        try {
            const pk = this.sequelizeModel.primaryKeyAttribute ?? "id";
            const rows = await this.sequelizeModel.findAll({
                where: this.conditions,
                order: [[this.sortCol ?? pk, this.sortOrder]],
                limit: this.limitVal,
            });
            const data = rows.map((r) => r.toJSON() as T);
            return { data, count: data.length, error: null };
        } catch (err) {
            return { data: null, count: 0, error: String(err) };
        }
    }

    async first(): Promise<SingleResult<T>> {
        try {
            const pk = this.sequelizeModel.primaryKeyAttribute ?? "id";
            const row = await this.sequelizeModel.findOne({
                where: this.conditions,
                order: [[this.sortCol ?? pk, this.sortOrder]],
            });
            return { data: row ? (row.toJSON() as T) : null, error: null };
        } catch (err) {
            return { data: null, error: String(err) };
        }
    }
}

class PSQLQueryBuilder implements QueryBuilder {
    private sequelize: Sequelize;
    private sql: string;
    private params: unknown[];
    private sortOrder: string | undefined;
    private limitVal: number | undefined;

    constructor(sequelize: Sequelize, sql: string, params: unknown[] = []) {
        this.sequelize = sequelize;
        this.sql = sql;
        this.params = params;
    }

    sort(order: "asc" | "desc"): this {
        this.sortOrder = order.toUpperCase();
        return this;
    }

    limit(n: number): this {
        this.limitVal = n;
        return this;
    }

    async run(): Promise<QueryResult> {
        try {
            let finalSQL = this.sql;
            if (this.sortOrder) finalSQL += ` ORDER BY 1 ${this.sortOrder}`;
            if (this.limitVal) finalSQL += ` LIMIT ${this.limitVal}`;

            const [results] = await this.sequelize.query(finalSQL, {
                replacements: this.params,
            });
            return {
                data: results as unknown[],
                count: (results as unknown[]).length,
                error: null,
            };
        } catch (err) {
            return { data: null, count: 0, error: String(err) };
        }
    }
}

export class PSQLDatabase extends DatabaseTemplate {
    protected driverName = "psql";
    private sequelize: Sequelize | null = null;
    private modelCache: Map<string, ModelStatic<Model>> = new Map();
    private connected = false;

    async connect(): Promise<void> {
        const url = Config.PSQL_DATABASE;
        if (!url) throw new Error(`[PSQLDatabase] No connection URL for mode: ${Config.MODE}`);

        this.sequelize = new Sequelize(url, {
            dialect: "postgres",
            logging: Config.MODE === "development" ? console.log : false,
        });

        await this.sequelize.authenticate();
        this.connected = true;
        console.log(`[PSQLDatabase] Connected (${Config.MODE})`);
    }

    async disconnect(): Promise<void> {
        await this.sequelize?.close();
        this.connected = false;
        console.log("[PSQLDatabase] Disconnected");
    }

    isConnected(): boolean {
        return this.connected;
    }

    private resolveModel<T extends object>(
        ModelClass: new () => T
    ): ModelStatic<Model> {
        if (!this.sequelize) throw new Error("[PSQLDatabase] Not connected");

        const instance = new ModelClass() as unknown as ModelTemplate;
        const { table, fields } = instance;

        if (this.modelCache.has(table)) {
            return this.modelCache.get(table)!;
        }

        const attributes: ModelAttributes<Model> = {};
        for (const [name, def] of Object.entries(fields)) {
            const col: ModelAttributeColumnOptions = {} as ModelAttributeColumnOptions;
            switch (def.type) {
                case "uuid": col["type"] = DataTypes.UUID; break;
                case "number": col["type"] = DataTypes.INTEGER; break;
                case "boolean": col["type"] = DataTypes.BOOLEAN; break;
                case "date": col["type"] = DataTypes.DATE; break;
                case "json": col["type"] = DataTypes.JSON; break;
                case "text": col["type"] = DataTypes.TEXT; break;
                default: col["type"] = DataTypes.STRING; break;
            }
            if (def.primary) col["primaryKey"] = true;
            if (def.unique) col["unique"] = true;
            if (def.nullable === false) col["allowNull"] = false;
            if (def.default !== undefined) {
                col["defaultValue"] = typeof def.default === "function"
                    ? def.default
                    : def.default;
            }
            attributes[name] = col;
        }
        const SeqModel = this.sequelize.define(table, attributes, {
            tableName: table,
            timestamps: false,
        });
        this.modelCache.set(table, SeqModel);
        return SeqModel;
    }

    fetch<T extends ModelTemplate<any>>(ModelClass: new () => T): FetchBuilder<DataOf<T>> {
        const seqModel = this.resolveModel(ModelClass);
        return new PSQLFetchBuilder<DataOf<T>>(seqModel);
    }

    query(sql: string, params?: unknown[]): QueryBuilder {
        if (!this.sequelize) throw new Error("[PSQLDatabase] Not connected");
        return new PSQLQueryBuilder(this.sequelize, sql, params);
    }

    async insert<T extends object>(
        ModelClass: new () => T,
        data: Partial<T>
    ): Promise<SingleResult<T>> {
        try {
            const seqModel = this.resolveModel(ModelClass);
            const row = await seqModel.create(data);
            return { data: row.toJSON() as T, error: null };
        } catch (err) {
            return { data: null, error: String(err) };
        }
    }

    async update<T extends object>(
        ModelClass: new () => T,
        conditions: Partial<T>,
        data: Partial<T>
    ): Promise<QueryResult<T>> {
        try {
            const seqModel = this.resolveModel(ModelClass);
            const [count, rows] = await seqModel.update(data as object, {
                where: conditions,
                returning: true,
            });
            return {
                data: rows.map((r) => r.toJSON() as T),
                count,
                error: null,
            };
        } catch (err) {
            return { data: null, count: 0, error: String(err) };
        }
    }

    async remove<T extends object>(
        ModelClass: new () => T,
        conditions: Partial<T>
    ): Promise<QueryResult<T>> {
        try {
            const seqModel = this.resolveModel(ModelClass);
            const count = await seqModel.destroy({ where: conditions });
            return { data: [], count, error: null };
        } catch (err) {
            return { data: null, count: 0, error: String(err) };
        }
    }

    async registerModel<T extends object>(ModelClass: new () => T): Promise<void> {
        this.resolveModel(ModelClass);
    }
    async syncModels(force = false): Promise<void> {
        if (!this.sequelize) throw new Error("[PSQLDatabase] Not connected");
        await this.sequelize.sync({ force });
        console.log(`[PSQLDatabase] Models synced (force: ${force})`);
    }
}