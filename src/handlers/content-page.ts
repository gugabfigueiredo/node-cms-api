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

        const { id } = req.params
        const parsedId = parseInt(id)
        if (isNaN(parsedId)) {
            this.logger.E("invalid id for content page", "could not parse id", { id })
            res.status(400)
        }

        const logger = this.logger.C({ id: parsedId })
        logger.I("read content page request")

        this.db.read(new ContentPage({ id: parsedId })).then(
            result => {
                if (result.error) {
                    logger.E("could not read content page", result.error)
                    res.status(500).end()
                }

                const contentPage = result.rows[0]
                logger.I("got content page", { page: contentPage.name })
                res.status(200).json({ page: contentPage })
            }
        )

    }

    readContentPages = (req: Request, res: Response) => {

        this.logger.I("read content pages request", { query: req.query })

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

        const updatePage = new ContentPage(req.body)

        const logger = this.logger.C({ updatePage })
        logger.I("update content page request")

        this.db.update(updatePage).then(
            result => {
                if (result.error) {
                    logger.E("failed to update content page", result.error)
                    res.status(500).end()
                }

                logger.I("content page updated successfully")
                res.status(200).end()
            }
        )
    }

    deleteContentPage = (req: Request, res: Response) => {
        const { id } = req.params
        const parsedId = parseInt(id)
        if (isNaN(parsedId)) {
            this.logger.E("invalid id for content page", "could not parse id", { id })
            res.status(400)
        }

        const logger = this.logger.C({ id: parsedId })
        logger.I("delete content page request")

        this.db.delete(new ContentPage({ id: parsedId })).then(
            result => {
                if (result.error) {
                    logger.E("failed to delete content page", result.error)
                    res.status(500).end()
                }

                logger.I("content page deleted successfully")
                res.status(200).end()
            }
        )
    }
}

