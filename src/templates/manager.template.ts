export abstract class ManagerTemplate<TDriver extends string, TTemplate extends {
    isConnected(): boolean;
    connect(...args: any[]): Promise<void>;
    disconnect(): Promise<void>;
}> {
    protected drivers: Map<TDriver, TTemplate> = new Map();
    private connectionErrors: Map<TDriver, Error> = new Map();

    // ── Abstract ──────────────────────────────────────────────────────────────

    protected abstract label: string; // e.g. "DatabaseManager"

    // ── Resolve (auto-reconnects) ─────────────────────────────────────────────

    protected async resolve(driver: TDriver): Promise<TTemplate> {
        const connErr = this.connectionErrors.get(driver);
        if (connErr) throw new Error(`[${this.label}] Driver "${driver}" is unavailable: ${connErr.message}`);

        const instance = this.drivers.get(driver);
        if (!instance) throw new Error(`[${this.label}] Unknown driver: "${driver}"`);

        if (!instance.isConnected()) {
            console.warn(`[${this.label}] Driver "${driver}" not connected. Reconnecting...`);
            try {
                await instance.connect();
                this.connectionErrors.delete(driver);
            } catch (err) {
                this.connectionErrors.set(driver, err as Error);
                throw new Error(`[${this.label}] Reconnect failed for "${driver}": ${(err as Error).message}`);
            }
        }

        return instance;
    }

    // ── Guards (for sync methods that bypass resolve) ─────────────────────────

    protected resolveSync(driver: TDriver): TTemplate {
        const connErr = this.connectionErrors.get(driver);
        if (connErr) throw new Error(`[${this.label}] Driver "${driver}" is unavailable: ${connErr.message}`);

        const instance = this.drivers.get(driver);
        if (!instance) throw new Error(`[${this.label}] Unknown driver: "${driver}"`);
        if (!instance.isConnected()) throw new Error(`[${this.label}] Driver "${driver}" is not connected.`);

        return instance;
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    async connect(driver: TDriver, ..._: any[]): Promise<void> {
        const instance = this.drivers.get(driver);
        if (!instance) throw new Error(`[${this.label}] Unknown driver: "${driver}"`);
        try {
            await instance.connect();
            this.connectionErrors.delete(driver);
        } catch (err) {
            this.connectionErrors.set(driver, err as Error);
            console.warn(`[${this.label}] Could not connect "${driver}":`, err);
        }
    }

    async connectAll(): Promise<void> {
        for (const [name, instance] of this.drivers) {
            try {
                await instance.connect();
                this.connectionErrors.delete(name);
            } catch (err) {
                console.warn(`[${this.label}] Could not connect "${name}":`, err);
                this.connectionErrors.set(name, err as Error);
            }
        }
    }

    async disconnect(driver: TDriver): Promise<void> {
        await this.drivers.get(driver)?.disconnect();
        this.connectionErrors.delete(driver);
    }

    async disconnectAll(): Promise<void> {
        for (const [name, instance] of this.drivers) {
            try {
                await instance.disconnect();
            } catch (err) {
                console.warn(`[${this.label}] Could not disconnect "${name}":`, err);
            } finally {
                this.connectionErrors.delete(name);
            }
        }
    }

    // ── Introspection ─────────────────────────────────────────────────────────

    protected isAvailable(driver: TDriver): boolean {
        return !this.connectionErrors.has(driver) && (this.drivers.get(driver)?.isConnected() ?? false);
    }

    protected getError(driver: TDriver): Error | undefined {
        return this.connectionErrors.get(driver);
    }

    protected setError(driver: TDriver, err: Error): void {
        this.connectionErrors.set(driver, err);
    }

    protected clearError(driver: TDriver): void {
        this.connectionErrors.delete(driver);
    }
}