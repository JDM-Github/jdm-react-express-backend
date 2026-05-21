import { Router } from "express";
import { getAllPersons, getPersonToken } from "../controllers/person.controller.js";
import { require_access } from "../middlewares/require.middleware.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

class PersonRoute {

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
        this.router.get(
            "/",
            require_access,
            authenticate,
            authorize("admin", "user"),
            getAllPersons
        );
    }

    private postRoutes(): void {
        this.router.post(
            "/token",
            require_access,
            getPersonToken
        );
    }

    private putRoutes(): void { }
    private deleteRoutes(): void { }
    private patchRoutes(): void { }
}

export default new PersonRoute().router;