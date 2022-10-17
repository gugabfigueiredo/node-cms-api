import {Request, Response} from "express";
import {Database} from "../database";
import {ContentPage} from "../model/model";
import {Logger} from "mini-ts-logger";

export class ContentHandler {

    constructor(public db: Database, public logger: Logger) {}


    createContentPage = (req: Request, res: Response) => {
        const newPage = new ContentPage(req.body)
        const logger = this.logger.C({ newPage })
        logger.I("create content page request")
        this.db.create(newPage).then(
            result => {
                if (result.error) {
                    logger.E("failed to create content page", result.error)
                    res.status(500).end()
                }
                logger.I("content page created successfully")
                res.status(200).end()
            }
        )
    }

    readContentPage = (req: Request, res: Response) => {
        this.logger.I("read content page request")
        const { id } = req.params
        const parsedId = parseInt(id)
        if (isNaN(parsedId)) {
            this.logger.E("invalid id for content page", "could not parse id", { id })
            res.status(400)
        }
        this.db.read(new ContentPage({ id: parsedId })).then(
            result => {
                if (result.error) {
                    this.logger.E("could not read content page", result.error, { id: parsedId })
                    res.status(500).end()
                }

                const contentPage = result.rows[0]
                this.logger.I("got content page", { page: contentPage.name })
                res.status(200).json({ page: contentPage })
            }
        )

    }

    readContentPages = (req: Request, res: Response) => {
        this.logger.I("read content pages request")
        this.db.read(new ContentPage({}), req.query).then(
            result => {
                if (result.error) {
                    this.logger.E("could not read content pages", result.error)
                    res.status(500).end()
                }

                const { page, pageSize, pageCount, rowCount, rows } = result
                this.logger.I("got content pages", { rowCount, pageCount  })
                res.status(200).json({ rows, rowCount, page, pageSize, pageCount })
            }
        )

    }

    updateContentPage = (req: Request, res: Response) => {

    }

    deleteContentPage = (req: Request, res: Response) => {

    }
}

