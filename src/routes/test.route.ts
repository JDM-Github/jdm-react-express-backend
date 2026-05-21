import { Router } from "express";
import {
    getTest,
    postTest,
    postEmail,
    postUpload,
    postUploadFile,
    postUploadFiles,
    deleteUpload,
    postCache,
    getCache,
    deleteCache,
    flushCache,
    postQueue,
    getQueueStatus,
    deleteQueue,
    getSocket,
    postSocketBroadcast,
    postSocketEmit,
    postSocketRoom,
} from "../controllers/test.controller.js";
import { require_access } from "../middlewares/require.middleware.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import { Upload } from "../middlewares/upload.middleware.js";

class TestRoute {
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
        // basic
        this.router.get("/", require_access, authenticate, authorize("admin", "user"), getTest);
        this.router.get("/:number", require_access, authenticate, authorize("admin", "user"), getTest);

        // cache
        this.router.get("/cache/:key", require_access, authenticate, getCache);

        // queue
        this.router.get("/queue/:queue/:jobId", require_access, authenticate, getQueueStatus);

        // socket
        this.router.get("/socket", require_access, authenticate, getSocket);
    }

    private postRoutes(): void {
        // basic
        this.router.post("/", require_access, authenticate, postTest);

        // email
        this.router.post("/email", require_access, authenticate, postEmail);

        // storage
        this.router.post("/upload", require_access, authenticate, postUpload);
        this.router.post("/upload/file", require_access, authenticate, Upload.single("file"), Upload.requireFile, postUploadFile);
        this.router.post("/upload/files", require_access, authenticate, Upload.array("files"), Upload.requireFiles, postUploadFiles);

        // cache
        this.router.post("/cache", require_access, authenticate, postCache);

        // queue
        this.router.post("/queue", require_access, authenticate, postQueue);

        // socket
        this.router.post("/socket/broadcast", require_access, authenticate, postSocketBroadcast);
        this.router.post("/socket/emit", require_access, authenticate, postSocketEmit);
        this.router.post("/socket/room", require_access, authenticate, postSocketRoom);
    }

    private putRoutes(): void { }
    private deleteRoutes(): void {
        // storage
        this.router.delete("/upload/:folder/:id", require_access, authenticate, deleteUpload);

        // cache
        this.router.delete("/cache/:key", require_access, authenticate, deleteCache);
        this.router.delete("/cache", require_access, authenticate, flushCache);

        // queue
        this.router.delete("/queue/:queue/:jobId", require_access, authenticate, deleteQueue);
    }

    private patchRoutes(): void { }
}

export default new TestRoute().router;