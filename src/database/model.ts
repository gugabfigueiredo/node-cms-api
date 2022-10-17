export type ModelConstructor<T extends Model> = {
    new(args: { [k: string]: any }): T;
}

export class Model {
    tableName: string = ""

    constructor(public data: { [k: string]: any }) {
    }

    table = (): string[] => {
        return this.tableName.split(".");
    }

    new = (args: { [k: string]: any }): this => {
        return new (this.constructor as ModelConstructor<this>)(args)
    }
}