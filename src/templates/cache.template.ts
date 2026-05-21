export interface CacheResult {
    key: string | null;
    value: unknown;
    error: string | null;
}

export interface DeleteResult {
    key: string | null;
    deleted: boolean;
    error: string | null;
}

export abstract class CacheTemplate {
    protected abstract driverName: string;

    abstract connect(): Promise<void>;
    abstract disconnect(): Promise<void>;
    abstract isConnected(): boolean;

    abstract get(key: string): Promise<CacheResult>;
    abstract set(key: string, value: unknown, ttl?: number): Promise<CacheResult>;
    abstract delete(key: string): Promise<DeleteResult>;
    abstract deleteBatch(keys: string[]): Promise<DeleteResult[]>;
    abstract exists(key: string): Promise<boolean>;
    abstract flush(): Promise<void>;
    abstract keys(pattern?: string): Promise<string[]>;
    abstract ttl(key: string): Promise<number>;

    getName(): string {
        return this.driverName;
    }
}