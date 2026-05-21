import ManagerDatabase from "../managers/database.manager.js";
import { PersonModel } from "../models/person.model.js";
import { signToken } from "../utils/jwt.js";
import type { DatabaseDriver } from "../managers/database.manager.js";

const TARGET = (process.env["TARGET_DATABASE"] ?? "psql") as DatabaseDriver;

class PersonService {

    public async fetchAll() {
        await ManagerDatabase.registerModel(TARGET, PersonModel);
        return ManagerDatabase.fetch(TARGET, PersonModel).all();
    }

    public async getTokenById(id: string) {
        await ManagerDatabase.registerModel(TARGET, PersonModel);

        const result = await ManagerDatabase
            .fetch(TARGET, PersonModel)
            .where({ id })
            .first();   

        if (result.error) return { token: null, error: result.error };
        if (!result.data) return { token: null, error: "Person not found" };

        const data = result.data;
        const token = signToken({
            id: data.id,
            email: data.email,
            role: "user",
        });

        return { token, error: null };
    }

}

export default new PersonService();