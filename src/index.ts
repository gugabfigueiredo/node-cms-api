import { Route, Server } from "./server";
import { Logger, LOG_LEVEL } from "mini-ts-logger";
import { ContentHandler } from "./handlers";
import { Database } from "./database";

const CONTEXT: string = process.env.CMS_CONTEXT ?? "cms-api"
const LOGGING: string = process.env.CMS_LOG_LEVEL ?? LOG_LEVEL.DEBUG
const logger = new Logger(console, LOGGING, { context: CONTEXT })

const dbCredentials = {
    url: process.env.CMS_DATABASE_CONNECTION_STRING,
    user: process.env.CMS_DATABASE_USERNAME ?? "cms-user",
    password: process.env.CMS_DATABASE_PASSWORD ?? "123qwe",
    host: process.env.CMS_DATABASE_HOST ?? "localhost",
    port: parseInt(process.env.CMS_DATABASE_PORT ?? "5432"),
    database: process.env.CMS_DATABASE_NAME ?? "cms"
}

try {
    const db = new Database(dbCredentials, logger)

    const handler = new ContentHandler(db, logger);
    handler.logger.I("handler initiated successfully")

    const server = Server(`/${CONTEXT}`, Route((r) => {
        r.use("/content", Route((r) => {
            r.post("/create", handler.createContentPage)

            r.get("/id/:id(\\d+)", handler.readContentPage)
            r.get(["/", "/page/:page(\\d+)"], handler.readContentPages)

            r.put("/update", handler.updateContentPage)

            r.delete("/delete/id/:id(\\d+)", handler.deleteContentPage)
        }))
    }))

    const PORT: any = process.env.CMS_PORT ?? 8080
    server.listen(`${PORT}`, () => {
        logger.I(`Server started at port ${PORT}`)
    })
} catch (e) {
    logger.E("failed to start server", e)
}