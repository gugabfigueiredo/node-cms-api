import { QueryResult } from "pg";
import format from "pg-format";

export interface Query {
    order?: string;
    page?: number;
    pageSize?: number;
    where: string;
}

export interface QResult extends QueryResult {
    error?: any
}

export interface QPaginatedResult extends QueryResult, QResult {
    page?: number;
    pageSize?: number;
    pageCount?: number;
}

export const parseQueryParams = (params: { [key: string]: any } = {}) : Query => {
    const { order, page, pageSize, limit, ...raw } = params

    const ordered: string[] | undefined = order && (Array.isArray(order) ? order : [order])
        .map((p: string) => p.replaceAll("__", " "))

    return {
        page: parseInt(page),
        pageSize: parseInt(pageSize || limit),
        where: Object.entries(raw).map(build).join(" and "),
        order: ordered ? format("%L", ordered) : undefined}
}

const build = ([k, v]: [string, any]) => {
    if (k === "name" || k === "label") return iLike(k, v)
    if (k.includes(".")) return jsonEqual(k, v)
    return equal(k, v)
}

const equal = (k: string, v: any) => {
    return format("%I = %L", k, v)
}

const jsonEqual = (k: string, v: any) => {
    let parts = k.split(".")
    const last = parts.pop()
    const [head, ...tail] = parts
    return format(`%I${tail.length ? "->" + tail.map(p => `'${p}'`).join("->") : ""}->'${last}' = %L`, head, v)
}

const iLike = (k: string, v: any) => {
    return format('%I ILIKE %L', k, `%${v}%`)
}