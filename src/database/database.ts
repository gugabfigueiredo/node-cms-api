import { Client } from "pg";
import { Logger } from "mini-ts-logger";
import { parseQueryParams, QPaginatedResult, QResult } from "./query";
import format from "pg-format";
import { Model } from "./model";

export type Credentials = {
    connectionString?: string;
    user?: string;
    host?: string;
    port?: number;
    database?: string;
    password?: string;
}

export interface IDatabase {
    create: <T extends Model>(m: T) => Promise<QResult>
    read: <T extends Model>(m: T, q?: {[k: string]: any}) => Promise<QPaginatedResult>
    update: <T extends Model>(m: T) => Promise<QResult>
    delete: <T extends Model>(m: T) => Promise<QResult>
}

export class Database implements IDatabase {

    client: Client

    constructor({ ...credentials }: Credentials, public logger: Logger) {
        this.client = new Client({...credentials })
        this.logger.I("trying to connect to database", { ...credentials })
        this.connect()
            .then(
                () => { this.logger.I("connection open with database") },
                reason => { this.logger.F("failed to connect to database", reason) }
            )
    }

    private async connect() {
        await this.client.connect();
    }

    close = async () => {
        await this.client.end();
    }

    create = async <T extends Model>(model: T) : Promise<QResult> => {

        const db = this.client.database
        const { data, table } = model
        const entries = Object.entries(data).filter(([k,]) => k !== "id")

        const queryString = `
            INSERT INTO ${format("%I.%I.%I", db, ...table())}
                (${format("%I", entries.map(([k,]) => k))})
                VALUES (${format("%L", entries.map(([,v]) => v))})
                RETURNING id, "name", "created_at"
        `.replaceAll(/\s+/g, " ").trim()

        this.logger.I("running query", { db, table: table(), query: queryString })
        return this.client.query(queryString).then(
            result => {
                const { oid, rowCount, rows } = result
                this.logger.I(`inserted in database`, { oid, rowCount })
                return { ...result, row: rows.map(r => model.new(r)) }
            },
            reason => {
                this.logger.E("failed to execute query", reason, { query: queryString })
                return { error: reason, rowCount: 0, rows: [], oid: 0, command: "", fields: [] }
            }
        )
    }

    read = async <T extends Model>(model: T, qParams: {[k: string]: any} | undefined = {}) : Promise<QPaginatedResult> => {

        const db = this.client.database
        const { data, table } = model
        const { order, page, pageSize, where } = parseQueryParams({ ...data, ...qParams })

        const base = `
            SELECT * from ${format("%I.%I.%I", db, ...table())}
            ${where ? `WHERE ${where}` : ""}
            ${order ? `ODER BY ${order}` : ""}
        `.replaceAll(/\s+/g, " ").trim()

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
                    `.replaceAll(/\s+/g, " ").trim()

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
        `.replaceAll(/\s+/g, " ").trim()

        this.logger.I("running query", { db, table: table(), query: queryString })
        return this.client.query(queryString).then(
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

    delete = async <T extends Model>(model: T) : Promise<QResult> => {

        const db = this.client.database
        const { data, table } = model
        const { where } = parseQueryParams({id: data.id})

        const queryString = `
            DELETE FROM ${format("%I.%I.%I", db, ...table())}
            WHERE ${where}
        `.replaceAll(/\s+/g, " ").trim()

        this.logger.I("running query", { db, table: table(), query: queryString })
        return this.client.query(queryString).then(
            result => {
                const { rowCount } = result
                this.logger.I("query executed successfully", { rowCount })
                return { ...result }
            },
            reason => {
                this.logger.E("failed to execute query", reason, { query: queryString })
                return { error: reason, rowCount: 0, rows: [], oid: 0, command: "", fields: [] }
            }
        )
    }
}