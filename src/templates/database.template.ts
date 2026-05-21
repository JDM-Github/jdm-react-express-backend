import { ModelTemplate, DataOf } from "./model.template.js";

export interface QueryResult<T = unknown> {
    data: T[] | null;
    count: number;
    error: string | null;
}

export interface SingleResult<T = unknown> {
    data: T | null;
    error: string | null;
}

export interface FetchBuilder<T = unknown> {
    all(): Promise<QueryResult<T>>;
    first(): Promise<SingleResult<T>>;
    where(conditions: Partial<T>): FetchBuilder<T>;
    sort(order: "asc" | "desc", column?: string): FetchBuilder<T>;
    limit(n: number): FetchBuilder<T>;
}

export interface QueryBuilder {
    sort(order: "asc" | "desc"): QueryBuilder;
    limit(n: number): QueryBuilder;
    run(): Promise<QueryResult>;
}

export abstract class DatabaseTemplate {
    protected abstract driverName: string;

    abstract connect(): Promise<void>;
    abstract disconnect(): Promise<void>;
    abstract isConnected(): boolean;

    abstract fetch<T extends ModelTemplate<any>>(model: new () => T): FetchBuilder<DataOf<T>>;
    abstract query(sql: string, params?: unknown[]): QueryBuilder;

    abstract insert<T extends object>(model: new () => T, data: Partial<T>): Promise<SingleResult<T>>;
    abstract update<T extends object>(model: new () => T, conditions: Partial<T>, data: Partial<T>): Promise<QueryResult<T>>;
    abstract remove<T extends object>(model: new () => T, conditions: Partial<T>): Promise<QueryResult<T>>;

    abstract registerModel<T extends object>(ModelClass: new () => T): Promise<void>;  // ← async now
    abstract syncModels(force?: boolean): Promise<void>;

    getName(): string {
        return this.driverName;
    }
}