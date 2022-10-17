import { Route, Server } from "./server";
import { Logger, LOG_LEVEL } from "mini-ts-logger";
import { ContentHandler } from "./handlers";
import {Database} from "./database";

const CONTEXT: string = process.env.CMS_CONTEXT ?? "cms-api"
const LOGGING: string = process.env.CMS_LOG_LEVEL ?? LOG_LEVEL.DEBUG
const logger = new Logger(console, LOGGING, { context: CONTEXT })

const dbCredentials = {
    url: process.env.CMS_DATABASE_CONNECTION_STRING,
    user: process.env.CMS_DATABASE_USERNAME,
    password: process.env.CMS_DATABASE_PASSWORD,
    host: process.env.CMS_DATABASE_HOST,
    port: parseInt(process.env.CMS_DATABASE_PORT || ""),
    database: process.env.CMS_DATABASE_NAME
}
try {
    const db = new Database(dbCredentials, logger)

    const handler = new ContentHandler(db, logger);

    const server = Server(`/${CONTEXT}`, Route((r) => {
        r.use("/content", Route((r) => {
            r.get(["/", "/page/:page(\d+)"], handler.readContentPages)

            r.post("/id/:id(\d+)", handler.createContentPage)
            r.get("/id/:id(\d+)", handler.readContentPage)
            r.put("/id/:id(\d+)", handler.updateContentPage)
        }))
    }))

    const PORT: any = process.env.CMS_PORT ?? 8080;
    server.listen(`${PORT}`, () => {
        logger.I(`Server started at port 3333`);
    })
} catch (e) {
    logger.E("failed to start server", e)
}