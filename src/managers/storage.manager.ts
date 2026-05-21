import { StorageTemplate, UploadResult, DeleteResult, RenameResult, FileInfo, UploadOptions, UrlOptions } from "../templates/storage.template.js";
import { CloudinaryStorage } from "./storages/cloudinary.storage.js";
import { LocalStorage } from "./storages/local.storage.js";
import { ManagerTemplate } from "../templates/manager.template.js";

export type StorageDriver = "cloudinary" | "local";

class StorageManager extends ManagerTemplate<StorageDriver, StorageTemplate> {
    protected label = "StorageManager";

    constructor() {
        super();
        this.drivers.set("cloudinary", new CloudinaryStorage());
        this.drivers.set("local", new LocalStorage());
    }

    async upload(driver: StorageDriver, file: string | Buffer, options?: UploadOptions): Promise<UploadResult> {
        return (await this.resolve(driver)).upload(file, options);
    }

    async uploadBatch(driver: StorageDriver, files: (string | Buffer)[], options?: UploadOptions): Promise<UploadResult[]> {
        return (await this.resolve(driver)).uploadBatch(files, options);
    }

    async delete(driver: StorageDriver, publicId: string): Promise<DeleteResult> {
        return (await this.resolve(driver)).delete(publicId);
    }

    async deleteBatch(driver: StorageDriver, publicIds: string[]): Promise<DeleteResult[]> {
        return (await this.resolve(driver)).deleteBatch(publicIds);
    }

    async rename(driver: StorageDriver, publicId: string, newPublicId: string): Promise<RenameResult> {
        return (await this.resolve(driver)).rename(publicId, newPublicId);
    }

    getUrl(driver: StorageDriver, publicId: string, options?: UrlOptions): string {
        return this.resolveSync(driver).getUrl(publicId, options);
    }

    async getInfo(driver: StorageDriver, publicId: string): Promise<FileInfo> {
        return (await this.resolve(driver)).getInfo(publicId);
    }

    async exists(driver: StorageDriver, publicId: string): Promise<boolean> {
        return (await this.resolve(driver)).exists(publicId);
    }
}

export default new StorageManager();