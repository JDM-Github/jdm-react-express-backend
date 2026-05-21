import { Router } from "express";
import {
    getSocketInfo,
    postEmit,
    postBroadcast,
    postEmitRoom,
    postJoinRoom,
    postLeaveRoom,
    getRoomCount,
    getSocketRooms,
    postRegisterEvent,
    deleteUnregisterEvent,
} from "../controllers/socket.controller.js";
import { require_access } from "../middlewares/require.middleware.js";

class SocketRoute {
    public router: Router;

    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.getRoutes();
        this.postRoutes();
        this.putRoutes();
        this.deleteRoutes();
        this.patchRoutes();
    }

    private getRoutes(): void {
        // info
        this.router.get("/", require_access, getSocketInfo);

        // rooms
        this.router.get("/room/:room/count", require_access, getRoomCount);
        this.router.get("/rooms/:socketId", require_access, getSocketRooms);
    }

    private postRoutes(): void {
        // emit
        this.router.post("/emit", require_access, postEmit);
        this.router.post("/broadcast", require_access, postBroadcast);

        // rooms
        this.router.post("/room/emit", require_access, postEmitRoom);
        this.router.post("/room/join", require_access, postJoinRoom);
        this.router.post("/room/leave", require_access, postLeaveRoom);

        // events
        this.router.post("/event", require_access, postRegisterEvent);
    }

    private putRoutes(): void { }

    private deleteRoutes(): void {
        // events
        this.router.delete("/event/:event", require_access, deleteUnregisterEvent);
    }

    private patchRoutes(): void { }
}

export default new SocketRoute().router;