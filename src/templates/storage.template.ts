export interface UploadResult {
    id: string | null;
    url: string | null;
    secureUrl: string | null;
    format: string | null;
    bytes: number | null;
    error: string | null;
}

export interface DeleteResult {
    id: string | null;
    deleted: boolean;
    error: string | null;
}

export interface RenameResult {
    id: string | null;
    url: string | null;
    secureUrl: string | null;
    error: string | null;
}

export interface FileInfo {
    id: string | null;
    url: string | null;
    secureUrl: string | null;
    format: string | null;
    bytes: number | null;
    createdAt: string | null;
    error: string | null;
}

export interface UploadOptions {
    folder?: string;
    publicId?: string;
    overwrite?: boolean;
    transformation?: Record<string, unknown>;
}

export interface UrlOptions {
    width?: number;
    height?: number;
    crop?: string;
    format?: string;
    quality?: number | string;
}

export abstract class StorageTemplate {
    protected abstract driverName: string;

    abstract connect(): Promise<void>;
    abstract disconnect(): Promise<void>;
    abstract isConnected(): boolean;

    abstract upload(file: string | Buffer, options?: UploadOptions): Promise<UploadResult>;
    abstract uploadBatch(files: (string | Buffer)[], options?: UploadOptions): Promise<UploadResult[]>;
    abstract delete(publicId: string): Promise<DeleteResult>;
    abstract deleteBatch(publicIds: string[]): Promise<DeleteResult[]>;
    abstract rename(publicId: string, newPublicId: string): Promise<RenameResult>;
    abstract getUrl(publicId: string, options?: UrlOptions): string;
    abstract getInfo(publicId: string): Promise<FileInfo>;
    abstract exists(publicId: string): Promise<boolean>;

    getName(): string {
        return this.driverName;
    }
}