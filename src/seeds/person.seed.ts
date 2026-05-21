import { SeederTemplate } from "../seeder.js";
import { PersonModel, PersonData } from "../models/person.model.js";
import ManagerDatabase, { DatabaseDriver } from "../managers/database.manager.js";

export class PersonSeeder extends SeederTemplate {
    private seeds: PersonData[] = [
        { name: "Alice Reyes", email: "alice@example.com", age: 28, active: true },
        { name: "Bob Santos", email: "bob@example.com", age: 34, active: true },
        { name: "Carol Manalo", email: "carol@example.com", age: 22, active: false },
    ];

    async run(driver: DatabaseDriver, fresh: boolean): Promise<void> {
        console.log(`[PersonSeeder] Running (fresh: ${fresh})`);

        if (fresh) {
            await ManagerDatabase.remove(driver, PersonModel, {});
            console.log("[PersonSeeder] Cleared existing records.");
        }

        for (const seed of this.seeds) {
            const result = await ManagerDatabase.insert(driver, PersonModel, seed);
            if (result.error) {
                console.warn(`[PersonSeeder] Skipped ${seed.email}: ${result.error}`);
            } else {
                console.log(`[PersonSeeder] Inserted: ${seed.email}`);
            }
        }
    }

    async undo(driver: DatabaseDriver): Promise<void> {
        console.log("[PersonSeeder] Undoing...");

        for (const seed of this.seeds) {
            await ManagerDatabase.remove(driver, PersonModel, { email: seed.email });
            console.log(`[PersonSeeder] Removed: ${seed.email}`);
        }
    }
}