import { ModelTemplate, FieldDefinition } from "../templates/model.template.js";

export interface PersonData {
    id: string;
    name: string;
    email: string;
    age?: number | null;
    active?: boolean;
    created_at?: Date;
}

export class PersonModel extends ModelTemplate<PersonData> {
    readonly table = "person";

    readonly fields: Record<string, FieldDefinition> = {
        id: {
            type: "uuid",
            primary: true,
            default: () => crypto.randomUUID(),
        },
        name: {
            type: "string",
            nullable: false,
        },
        email: {
            type: "string",
            unique: true,
            nullable: false,
        },
        age: {
            type: "number",
            nullable: true,
        },
        active: {
            type: "boolean",
            default: true,
        },
        created_at: {
            type: "date",
            default: () => new Date(),
        },
    };
}