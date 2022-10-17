import {QueryResult} from "pg";
import format from "pg-format";

export interface Query {
    order?: string[];
    page?: number;
    pageSize?: number;
    where: string;
}

export interface QResult extends QueryResult {
    error?: any
}

export interface QPaginatedResult extends QResult {
    page: number;
    pageSize: number;
    pageCount: number;
}

export const parseQueryParams = (params: { [key: string]: any } = {}) : Query => {
    let { order, page, pageSize, ...raw } = params

    return {page: parseInt(page), pageSize: parseInt(pageSize), where: Object.entries(raw).map(build).join(" and "),
        order: order ? order.map((p: string) => p.replaceAll("__", " ")) : undefined}
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