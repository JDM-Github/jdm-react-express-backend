import Config from "../../configs/env.config.js";
import Redis from "ioredis";
import type { Redis as RedisType } from "ioredis";
import { CacheTemplate, CacheResult, DeleteResult } from "../../templates/cache.template.js";

export class RedisCache extends CacheTemplate {
    protected driverName = "redis";
    private client: RedisType | null = null;
    private connected = false;

    async connect(): Promise<void> {
        const url = Config.REDIS_CACHE_URL;
        if (!url) throw new Error(`[RedisCache] No connection URL for mode: ${Config.MODE}`);

        const RedisClient = (Redis as any).default ?? Redis;
        this.client = new RedisClient(url);

        await new Promise<void>((resolve, reject) => {
            this.client!.once("ready", resolve);
            this.client!.once("error", reject);
        });

        this.connected = true;
        console.log("[RedisCache] Connected");
    }

    async disconnect(): Promise<void> {
        await this.client?.quit();
        this.client = null;
        this.connected = false;
        console.log("[RedisCache] Disconnected");
    }

    isConnected(): boolean {
        return this.connected;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private serialize(value: unknown): string {
        return JSON.stringify(value);
    }

    private deserialize(value: string | null): unknown {
        if (value === null) return null;
        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    }

    // ── CacheTemplate implementation ──────────────────────────────────────────

    async get(key: string): Promise<CacheResult> {
        try {
            if (!this.client) throw new Error("[RedisCache] Not connected");
            const value = await this.client.get(key);
            return { key, value: this.deserialize(value), error: null };
        } catch (err) {
            return { key, value: null, error: String(err) };
        }
    }

    async set(key: string, value: unknown, ttl?: number): Promise<CacheResult> {
        try {
            if (!this.client) throw new Error("[RedisCache] Not connected");
            const serialized = this.serialize(value);

            if (ttl) {
                await this.client.set(key, serialized, "EX", ttl);
            } else {
                await this.client.set(key, serialized);
            }

            return { key, value, error: null };
        } catch (err) {
            return { key, value: null, error: String(err) };
        }
    }

    async delete(key: string): Promise<DeleteResult> {
        try {
            if (!this.client) throw new Error("[RedisCache] Not connected");
            const count = await this.client.del(key);
            return { key, deleted: count > 0, error: null };
        } catch (err) {
            return { key, deleted: false, error: String(err) };
        }
    }

    async deleteBatch(keys: string[]): Promise<DeleteResult[]> {
        return Promise.all(keys.map((key) => this.delete(key)));
    }

    async exists(key: string): Promise<boolean> {
        try {
            if (!this.client) return false;
            const count = await this.client.exists(key);
            return count > 0;
        } catch {
            return false;
        }
    }

    async flush(): Promise<void> {
        if (!this.client) throw new Error("[RedisCache] Not connected");
        await this.client.flushdb();
        console.log("[RedisCache] Flushed");
    }

    async keys(pattern = "*"): Promise<string[]> {
        try {
            if (!this.client) return [];
            return await this.client.keys(pattern);
        } catch {
            return [];
        }
    }

    async ttl(key: string): Promise<number> {
        try {
            if (!this.client) return -1;
            return await this.client.ttl(key);
        } catch {
            return -1;
        }
    }
}