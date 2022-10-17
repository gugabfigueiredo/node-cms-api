import {Client} from "pg";
import {Logger} from "mini-ts-logger";
import {parseQueryParams, QPaginatedResult, QResult} from "./query";
import format from "pg-format";

export type ModelConstructor<T extends Model> = {
    new (args: {[k: string]: any}): T;
}

export class Model {
    tableName: string = ""

    constructor(public data: {[k: string]: any}) {}

    table(): string {
        return this.tableName;
    }

    new(args: {[k: string]: any}): this {
        return new(this.constructor as ModelConstructor<this>)(args)
    }
}

export type Credentials = {
    connectionString?: string;
    user?: string;
    host?: string;
    port?: number;
    database?: string;
    password?: string;
}

export interface DB {
    create: <T extends Model>(m: T) => Promise<QResult>
    read: <T extends Model>(m: T, q: T) => Promise<QResult | QPaginatedResult>
    update: <T extends Model>(m: T) => Promise<QResult>
}

export class Database implements DB {

    client: Client
    logger: Logger

    constructor({ url, ...credentials }: Credentials, logger: Logger) {
        this.client = new Client({...credentials, connectionString: url})
        this.logger = logger
        this.connect()
            .then(
                () => { logger.I("connection open with database") },
                reason => { logger.F("failed to connect to database", reason) }
            )
    }

    private async connect() {
        await this.client.connect();
    }

    async close() {
        await this.client.end();
    }

    async create<T extends Model>(model: T) : Promise<QResult> {

        const db = this.client.database
        const { data, table } = model
        const keys = Object.keys(data).filter(k => k !== "id")

        const queryString = `
            INSERT INTO ${format("%I.%I", db, table())}
                (${keys.join(", ")})
                VALUES (${keys.map((k, i) => `$${i+1}`).join(", ")})
                RETURNING id, "name", "created_at"
        `

        this.logger.I("running query", { db, table: table(), query: queryString })
        return this.client.query(queryString, Object.values(data))
            .then(
                result => {
                    const { oid, rowCount, rows } = result
                    this.logger.I(`inserted in database`, { oid, rowCount })
                    return { ...result, row: rows.map(r => model.new(r)) }
                },
                reason => {
                    this.logger.F("failed to execute query", reason, { query: queryString })
                    return { error: reason, rowCount: 0, rows: [], oid: 0, command: "", fields: [] }
                }
            )
    }

    read = async <T extends Model>(model: T, qParams: {[k: string]: any} = {}) : Promise<QPaginatedResult> => {

        const db = this.client.database
        const { data, table } = model
        const { order, page, pageSize, where } = parseQueryParams({...data, ...qParams})

        const base = `
            SELECT * from ${format("%I.%I.%I", db, ...table())}
            ${where ? `WHERE ${where}` : ""}
            ${order ? `ODER BY ${order.join(", ")}` : ""}
        `

        this.logger.I("running initial query", { db, table: table(), query: base })
        return this.client.query(base).then(
            result => {
                const { rowCount, rows } = result
                if (pageSize) {
                    const pageCount = Math.ceil(rowCount / pageSize)
                    const paginated = `
                        ${base}
                        LIMIT ${pageSize}
                        ${page ? `OFFSET ${(page - 1) * pageSize}` : ""}
                    `
                    return this.client.query(paginated).then(
                        result => {
                            const { rowCount, rows } = result
                            this.logger.I("query executed successfully", { rowCount })
                            return { page, pageSize, pageCount, ...result, rows: rows.map(r => model.new(r)) }
                        },
                        reason => {
                            this.logger.E("failed to execute paginated query", reason, { query: paginated })
                            return { error: reason, rowCount: 0, rows: [], oid: 0, command: "", fields: [] }
                        }
                    )
                }
                this.logger.I("query executed successfully", { rowCount, pageSize })
                return { ...result, rows: rows.map(r => model.new(r)) }
            },
            reason => {
                this.logger.E("failed to execute query", reason, { query: base })
                return { error: reason, rowCount: 0, rows: [], oid: 0, command: "", fields: [] }
            }
        )
    }

    update = async <T extends Model>(model: T) : Promise<QResult> => {

        const db = this.client.database
        const { data, table } = model
        const columns = Object.entries(data).filter(([k,]) => k !== "id")
        const { where } = parseQueryParams({id: data.id})

        const queryString = `
            UPDATE ${format("%I.%I.%I", db, ...table())}
            SET ${columns.map(([k, v]) => format("%I = %L", k, v)).join(", ")}
            WHERE ${where}
        `

        this.logger.I("running query", { db, table: table(), query: queryString })
        return this.client.query(queryString)
            .then(
                result => {
                    const { rowCount, rows } = result
                    this.logger.I("query executed successfully", { rowCount })
                    return { ...result, rows: rows.map(r => model.new(r)) }
                },
                reason => {
                    this.logger.E("failed to execute query", reason, { query: queryString })
                    return { error: reason, rowCount: 0, rows: [], oid: 0, command: "", fields: [] }
                }
            )
    }
}