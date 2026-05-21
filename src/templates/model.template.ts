export type FieldType =
    | "string"
    | "number"
    | "boolean"
    | "date"
    | "uuid"
    | "json"
    | "text";

export interface FieldDefinition {
    type: FieldType;
    primary?: boolean;
    unique?: boolean;
    nullable?: boolean;
    default?: unknown | (() => unknown);
    references?: { model: string; field: string };
}

export abstract class ModelTemplate<TData = unknown> {
    abstract readonly table: string;
    abstract readonly fields: Record<string, FieldDefinition>;
    declare readonly _type: TData;

    getField(name: string): FieldDefinition | undefined {
        return this.fields[name];
    }

    getPrimaryKey(): string | undefined {
        return Object.entries(this.fields).find(
            ([, def]) => def.primary
        )?.[0];
    }

    getFieldNames(): string[] {
        return Object.keys(this.fields);
    }

    toJSON(): Record<string, FieldDefinition> {
        return this.fields;
    }
}

export type DataOf<T> = T extends ModelTemplate<infer D> ? D : never;