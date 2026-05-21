// storages/local.storage.ts
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import crypto from "crypto";
import {
    StorageTemplate,
    UploadResult,
    DeleteResult,
    RenameResult,
    FileInfo,
    UploadOptions,
    UrlOptions,
} from "../../templates/storage.template.js";

const BASE_URL = process.env["LOCAL_STORAGE_BASE_URL"] ?? "http://localhost:3000";
const UPLOAD_ROOT = process.env["LOCAL_STORAGE_PATH"] ?? "uploads";

export class LocalStorage extends StorageTemplate {
    protected driverName = "local";
    private connected = false;
    private uploadRoot: string = UPLOAD_ROOT;

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    async connect(): Promise<void> {
        await fs.mkdir(this.uploadRoot, { recursive: true });
        this.connected = true;
        console.log(`[LocalStorage] Connected — root: ${path.resolve(this.uploadRoot)}`);
    }

    async disconnect(): Promise<void> {
        this.connected = false;
        console.log("[LocalStorage] Disconnected");
    }

    isConnected(): boolean {
        return this.connected;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Resolves a publicId (e.g. "avatars/abc123") to an absolute file path.
     * The publicId acts as the relative path under uploadRoot (no extension stored
     * in the id itself — the real file may carry one, so we glob for it).
     */
    private resolve(publicId: string): string {
        // Prevent path-traversal attacks
        const safe = path.normalize(publicId).replace(/^(\.\.(\/|\\|$))+/, "");
        return path.join(this.uploadRoot, safe);
    }

    /**
     * Finds the actual file on disk for a given publicId.
     * The stored file may have an extension while publicId does not.
     */
    private async findFile(publicId: string): Promise<string | null> {
        const base = this.resolve(publicId);

        // Exact match first (publicId already includes extension)
        if (fsSync.existsSync(base)) return base;

        // Search in parent dir for files whose name starts with the basename
        const dir = path.dirname(base);
        const name = path.basename(base);

        try {
            const entries = await fs.readdir(dir);
            const match = entries.find(
                (e) => path.parse(e).name === name || e === name
            );
            return match ? path.join(dir, match) : null;
        } catch {
            return null;
        }
    }

    private extensionFromBuffer(buffer: Buffer): string {
        // Detect common magic bytes
        if (buffer[0] === 0xff && buffer[1] === 0xd8) return ".jpg";
        if (buffer[0] === 0x89 && buffer[1] === 0x50) return ".png";
        if (buffer[0] === 0x47 && buffer[1] === 0x49) return ".gif";
        if (buffer[0] === 0x52 && buffer[1] === 0x49) return ".webp";
        if (buffer[0] === 0x25 && buffer[1] === 0x50) return ".pdf";
        return ".bin";
    }

    private buildUrls(relativePath: string): { url: string; secureUrl: string } {
        const encoded = relativePath.split(path.sep).map(encodeURIComponent).join("/");
        const url = `${BASE_URL}/${encoded}`;
        const secureUrl = url.replace(/^http:/, "https:");
        return { url, secureUrl };
    }

    private async statFile(filePath: string) {
        return fs.stat(filePath);
    }

    // ── StorageTemplate implementation ────────────────────────────────────────

    async upload(file: string | Buffer, options?: UploadOptions): Promise<UploadResult> {
        try {
            let ext: string;
            let sourceBuffer: Buffer | null = null;
            let sourcePath: string | null = null;

            if (Buffer.isBuffer(file)) {
                ext = this.extensionFromBuffer(file);
                sourceBuffer = file;
            } else if (/^https?:\/\//i.test(file)) {
                const response = await fetch(file);
                if (!response.ok) throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
                const arrayBuffer = await response.arrayBuffer();
                sourceBuffer = Buffer.from(arrayBuffer);
                ext = path.extname(new URL(file).pathname) || this.extensionFromBuffer(sourceBuffer);
            } else {
                ext = path.extname(file) || ".bin";
                sourcePath = file;
            }

            // Build destination path
            const folder = options?.folder ?? "default";
            const publicId = options?.publicId ?? crypto.randomUUID();
            const relativePath = folder
                ? path.join(folder, publicId + ext)
                : publicId + ext;
            const destPath = path.join(this.uploadRoot, relativePath);

            // Ensure folder exists
            await fs.mkdir(path.dirname(destPath), { recursive: true });

            // Write file — skip if exists and overwrite is false
            if (!options?.overwrite && fsSync.existsSync(destPath)) {
                const stat = await this.statFile(destPath);
                const { url, secureUrl } = this.buildUrls(relativePath);
                return {
                    id: relativePath.replace(/\\/g, "/"),
                    url,
                    secureUrl,
                    format: ext.replace(".", ""),
                    bytes: stat.size,
                    error: null,
                };
            }

            if (sourceBuffer) {
                await fs.writeFile(destPath, sourceBuffer);
            } else if (sourcePath) {
                await fs.copyFile(sourcePath, destPath);
            }

            const stat = await this.statFile(destPath);
            const id = relativePath.replace(/\\/g, "/"); // normalise to forward slashes
            const { url, secureUrl } = this.buildUrls(relativePath);

            return {
                id,
                url,
                secureUrl,
                format: ext.replace(".", ""),
                bytes: stat.size,
                error: null,
            };
        } catch (err) {
            return { id: null, url: null, secureUrl: null, format: null, bytes: null, error: String(err) };
        }
    }

    async uploadBatch(files: (string | Buffer)[], options?: UploadOptions): Promise<UploadResult[]> {
        return Promise.all(files.map((file) => this.upload(file, options)));
    }

    async delete(publicId: string): Promise<DeleteResult> {
        try {
            const filePath = await this.findFile(publicId);
            if (!filePath) {
                return { id: publicId, deleted: false, error: "File not found" };
            }
            await fs.unlink(filePath);
            return { id: publicId, deleted: true, error: null };
        } catch (err) {
            return { id: publicId, deleted: false, error: String(err) };
        }
    }

    async deleteBatch(publicIds: string[]): Promise<DeleteResult[]> {
        return Promise.all(publicIds.map((id) => this.delete(id)));
    }

    async rename(publicId: string, newPublicId: string): Promise<RenameResult> {
        try {
            const srcPath = await this.findFile(publicId);
            if (!srcPath) {
                return { id: null, url: null, secureUrl: null, error: "Source file not found" };
            }

            const ext = path.extname(srcPath);
            const newRelative = newPublicId.endsWith(ext) ? newPublicId : newPublicId + ext;
            const destPath = path.join(this.uploadRoot, newRelative);

            await fs.mkdir(path.dirname(destPath), { recursive: true });
            await fs.rename(srcPath, destPath);

            const { url, secureUrl } = this.buildUrls(newRelative);
            return {
                id: newRelative.replace(/\\/g, "/"),
                url,
                secureUrl,
                error: null,
            };
        } catch (err) {
            return { id: null, url: null, secureUrl: null, error: String(err) };
        }
    }

    getUrl(publicId: string, _?: UrlOptions): string {
        // For local storage, transformations (resize/crop/format) are no-ops —
        // you'd need sharp or similar to apply them server-side.
        const { url } = this.buildUrls(publicId);
        return url;
    }

    async getInfo(publicId: string): Promise<FileInfo> {
        try {
            const filePath = await this.findFile(publicId);
            if (!filePath) {
                return { id: null, url: null, secureUrl: null, format: null, bytes: null, createdAt: null, error: "File not found" };
            }

            const stat = await this.statFile(filePath);
            const relative = path.relative(this.uploadRoot, filePath);
            const { url, secureUrl } = this.buildUrls(relative);

            return {
                id: relative.replace(/\\/g, "/"),
                url,
                secureUrl,
                format: path.extname(filePath).replace(".", "") || null,
                bytes: stat.size,
                createdAt: stat.birthtime.toISOString(),
                error: null,
            };
        } catch (err) {
            return { id: null, url: null, secureUrl: null, format: null, bytes: null, createdAt: null, error: String(err) };
        }
    }

    async exists(publicId: string): Promise<boolean> {
        return (await this.findFile(publicId)) !== null;
    }
}