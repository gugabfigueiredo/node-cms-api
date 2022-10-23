import { Route, Server } from "./server";
import { Logger, LOG_LEVEL } from "mini-ts-logger";
import { ContentHandler, TemplateHandler } from "./handlers";
import { Database } from "./database";
import { Express } from "express-serve-static-core";
import express, { Request, Response } from "express";

const CONTEXT: string = process.env.CMS_API_CONTEXT ?? "cms-api"
const LOGGING: string = process.env.CMS_API_LOG_LEVEL ?? LOG_LEVEL.DEBUG
const logger = new Logger(console, LOGGING, { context: CONTEXT })

const dbCredentials = {
    url: process.env.CMS_API_DATABASE_CONNECTION_STRING,
    user: process.env.CMS_API_DATABASE_USERNAME ?? "cms-user",
    password: process.env.CMS_API_DATABASE_PASSWORD ?? "123qwe",
    host: process.env.CMS_API_DATABASE_HOST ?? "localhost",
    port: parseInt(process.env.CMS_API_DATABASE_PORT ?? "5432"),
    database: process.env.CMS_API_DATABASE_NAME ?? "cms"
}

let server: Express

try {
    const db = new Database(dbCredentials, logger)

    const contentHandler = new ContentHandler(db, logger);
    const templateHandler = new TemplateHandler(db, logger);

    server = Server(`/${CONTEXT}`, Route((r) => {
        r.get("/health", (req: Request, res: Response) => {
            return res.status(200).json({ message: "Hello World!" })
        })
        r.use("/content", Route((r) => {
            r.post("/create", contentHandler.createContentPage)

            r.get("/id/:id(\\d+)", contentHandler.readContentPage)
            r.get(["/page/:page(\\d+)", "/"], contentHandler.readContentPages)

            r.put("/update", contentHandler.updateContentPage)

            r.delete("/delete/id/:id(\\d+)", contentHandler.deleteContentPage)
        }))

        r.use("/template", Route((r) => {
            r.post("/create", templateHandler.createTemplate)

            r.get("/id/:id(\\d+)", templateHandler.readTemplate)
            r.get(["/page/:page(\\d+)", "/"], templateHandler.readTemplates)

            r.put("/update", templateHandler.updateTemplate)

            r.delete("/delete/id/:id(\\d+)", templateHandler.deleteTemplate)
        }))
    }))

    const PORT: any = process.env.CMS_API_PORT ?? 8080
    server.listen(`${PORT}`, () => {
        logger.I(`Server started at port ${PORT}`)
    })
} catch (e) {
    logger.E("failed to start server", e)
    server = express()
}

export default server