import { Server as HttpServer } from "http";

export interface SocketResult {
    event: string | null;
    data: unknown;
    error: string | null;
}

export interface RoomResult {
    room: string | null;
    count: number;
    error: string | null;
}

export type SocketHandler<T = unknown> = (data: T, socketId: string) => void;

export abstract class SocketTemplate {
    protected abstract driverName: string;

    abstract connect(server: HttpServer): Promise<void>;
    abstract disconnect(): Promise<void>;
    abstract isConnected(): boolean;

    // emit to specific socket
    abstract emit(socketId: string, event: string, data: unknown): SocketResult;

    // emit to everyone
    abstract broadcast(event: string, data: unknown): SocketResult;

    // emit to a room
    abstract toRoom(room: string, event: string, data: unknown): SocketResult;

    // room management
    abstract join(socketId: string, room: string): Promise<RoomResult>;
    abstract leave(socketId: string, room: string): Promise<RoomResult>;
    abstract roomCount(room: string): Promise<number>;
    abstract rooms(socketId: string): Promise<string[]>;

    // event listeners
    abstract on<T>(event: string, handler: SocketHandler<T>): void;
    abstract off(event: string): void;

    // info
    abstract connectedCount(): number;
    abstract connectedIds(): string[];

    getName(): string {
        return this.driverName;
    }
}