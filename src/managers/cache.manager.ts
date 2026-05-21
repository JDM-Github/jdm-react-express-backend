import { CacheTemplate, CacheResult, DeleteResult } from "../templates/cache.template.js";
import { RedisCache } from "./caches/redis.cache.js";

export type CacheDriver = "redis";

class CacheManager {
    private drivers: Map<CacheDriver, CacheTemplate> = new Map();

    constructor() {
        this.drivers.set("redis", new RedisCache());
        // this.drivers.set("memcached", new MemcachedCache());
        // this.drivers.set("memory",    new MemoryCache());
    }

    // ── Resolve (auto-reconnects) ─────────────────────────────────────────────

    private async resolve(driver: CacheDriver): Promise<CacheTemplate> {
        const cache = this.drivers.get(driver);
        if (!cache) throw new Error(`[CacheManager] Unknown driver: "${driver}"`);

        if (!cache.isConnected()) {
            console.warn(`[CacheManager] Driver "${driver}" not connected. Reconnecting...`);
            await cache.connect();
        }

        return cache;
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    async connect(driver: CacheDriver): Promise<void> {
        const cache = this.drivers.get(driver);
        if (!cache) throw new Error(`[CacheManager] Unknown driver: "${driver}"`);
        await cache.connect();
    }

    async disconnect(driver: CacheDriver): Promise<void> {
        await this.drivers.get(driver)?.disconnect();
    }

    // ── Cache API ─────────────────────────────────────────────────────────────

    async get(driver: CacheDriver, key: string): Promise<CacheResult> {
        return (await this.resolve(driver)).get(key);
    }

    async set(driver: CacheDriver, key: string, value: unknown, ttl?: number): Promise<CacheResult> {
        return (await this.resolve(driver)).set(key, value, ttl);
    }

    async delete(driver: CacheDriver, key: string): Promise<DeleteResult> {
        return (await this.resolve(driver)).delete(key);
    }

    async deleteBatch(driver: CacheDriver, keys: string[]): Promise<DeleteResult[]> {
        return (await this.resolve(driver)).deleteBatch(keys);
    }

    async exists(driver: CacheDriver, key: string): Promise<boolean> {
        return (await this.resolve(driver)).exists(key);
    }

    async flush(driver: CacheDriver): Promise<void> {
        return (await this.resolve(driver)).flush();
    }

    async keys(driver: CacheDriver, pattern?: string): Promise<string[]> {
        return (await this.resolve(driver)).keys(pattern);
    }

    async ttl(driver: CacheDriver, key: string): Promise<number> {
        return (await this.resolve(driver)).ttl(key);
    }
}

export default new CacheManager();