import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { StorageTemplate, UploadResult, DeleteResult, RenameResult, FileInfo, UploadOptions, UrlOptions } from "../../templates/storage.template.js";

const CLOUD_NAME = process.env["CLOUDINARY_CLOUD_NAME"] ?? "";
const API_KEY = process.env["CLOUDINARY_API_KEY"] ?? "";
const API_SECRET = process.env["CLOUDINARY_API_SECRET"] ?? "";

export class CloudinaryStorage extends StorageTemplate {
    protected driverName = "cloudinary";
    private connected = false;

    async connect(): Promise<void> {
        if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
            throw new Error("[CloudinaryStorage] Missing CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET");
        }

        cloudinary.config({ cloud_name: CLOUD_NAME, api_key: API_KEY, api_secret: API_SECRET });

        // verify credentials
        await cloudinary.api.ping();
        this.connected = true;
        console.log("[CloudinaryStorage] Connected");
    }

    async disconnect(): Promise<void> {
        cloudinary.config({ cloud_name: "", api_key: "", api_secret: "" });
        this.connected = false;
        console.log("[CloudinaryStorage] Disconnected");
    }

    isConnected(): boolean {
        return this.connected;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private mapUpload(res: UploadApiResponse): UploadResult {
        return {
            id: res.public_id ?? null,
            url: res.url ?? null,
            secureUrl: res.secure_url ?? null,
            format: res.format ?? null,
            bytes: res.bytes ?? null,
            error: null,
        };
    }

    // ── StorageTemplate implementation ────────────────────────────────────────

    async upload(file: string | Buffer, options?: UploadOptions): Promise<UploadResult> {
        try {
            const res = await new Promise<UploadApiResponse>((resolve, reject) => {
                const opts = {
                    folder: options?.folder,
                    public_id: options?.publicId,
                    overwrite: options?.overwrite ?? true,
                    transformation: options?.transformation,
                };

                if (Buffer.isBuffer(file)) {
                    cloudinary.uploader.upload_stream(opts, (err, result) => {
                        if (err || !result) return reject(err);
                        resolve(result);
                    }).end(file);
                } else {
                    cloudinary.uploader.upload(file, opts)
                        .then(resolve)
                        .catch(reject);
                }
            });

            return this.mapUpload(res);
        } catch (err) {
            return { id: null, url: null, secureUrl: null, format: null, bytes: null, error: String(err) };
        }
    }

    async uploadBatch(files: (string | Buffer)[], options?: UploadOptions): Promise<UploadResult[]> {
        return Promise.all(files.map((file) => this.upload(file, options)));
    }

    async delete(publicId: string): Promise<DeleteResult> {
        try {
            const res = await cloudinary.uploader.destroy(publicId);
            return {
                id: publicId,
                deleted: res.result === "ok",
                error: res.result !== "ok" ? res.result : null,
            };
        } catch (err) {
            return { id: publicId, deleted: false, error: String(err) };
        }
    }

    async deleteBatch(publicIds: string[]): Promise<DeleteResult[]> {
        return Promise.all(publicIds.map((id) => this.delete(id)));
    }

    async rename(publicId: string, newPublicId: string): Promise<RenameResult> {
        try {
            const res = await cloudinary.uploader.rename(publicId, newPublicId);
            return {
                id: res.public_id ?? null,
                url: res.url ?? null,
                secureUrl: res.secure_url ?? null,
                error: null,
            };
        } catch (err) {
            return { id: null, url: null, secureUrl: null, error: String(err) };
        }
    }

    getUrl(publicId: string, options?: UrlOptions): string {
        return cloudinary.url(publicId, {
            secure: true,
            width: options?.width,
            height: options?.height,
            crop: options?.crop,
            fetch_format: options?.format ?? "auto",
            quality: options?.quality ?? "auto",
        });
    }

    async getInfo(publicId: string): Promise<FileInfo> {
        try {
            const res = await cloudinary.api.resource(publicId);
            return {
                id: res.public_id ?? null,
                url: res.url ?? null,
                secureUrl: res.secure_url ?? null,
                format: res.format ?? null,
                bytes: res.bytes ?? null,
                createdAt: res.created_at ?? null,
                error: null,
            };
        } catch (err) {
            return { id: null, url: null, secureUrl: null, format: null, bytes: null, createdAt: null, error: String(err) };
        }
    }

    async exists(publicId: string): Promise<boolean> {
        try {
            await cloudinary.api.resource(publicId);
            return true;
        } catch {
            return false;
        }
    }
}