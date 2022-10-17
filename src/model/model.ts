import { Model } from "../database/";

export class ContentPage extends Model{
    tableName = "content_pages.pages"
    constructor(public data: {
        id?: number,
        name?: string,
        template_id?: number,
        properties?: JSON,
        content?: JSON,
        status?: string,
        created_at?: any
    }) {
        super(data)
    }
}


export class Template extends Model{
    tableName = "content_pages.templates"
    constructor(public data: {
        id?: number;
        name?: string;
        label?: string;
        metadata?: JSON;
    }) {
        super(data)
    }
}