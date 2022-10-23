import { Database } from "../database";
import { Logger } from "mini-ts-logger";
import { Request, Response } from "express";
import { Template } from "../model";


export class TemplateHandler {

    constructor(public db: Database, public logger: Logger) {}


    createTemplate = (req: Request, res: Response) => {
        const newPage = new Template(req.body)
        const logger = this.logger.C({ newPage })
        logger.I("create template request")
        this.db.create(newPage).then(
            result => {
                if (result.error) {
                    logger.E("failed to create template", result.error)
                    res.status(500).end()
                }
                logger.I("template created successfully")
                res.status(200).end()
            }
        )
    }

    readTemplate = (req: Request, res: Response) => {
        const { id } = req.params
        this.logger.I("read template request", { id })
        const parsedId = parseInt(id)
        if (isNaN(parsedId)) {
            this.logger.E("invalid id for template", "could not parse id", { id })
            res.status(400)
        }

        const logger = this.logger.C({ id: parsedId })

        this.db.read(new Template({ id: parsedId })).then(
            result => {
                if (result.error) {
                    logger.E("could not read template", result.error)
                    res.status(500).end()
                }

                const template = result.rows[0]
                logger.I("got template", { template: template.name })
                res.status(200).json({ page: template })
            }
        )

    }

    readTemplates = (req: Request, res: Response) => {

        this.logger.I("read templates request", { query: req.query })

        this.db.read(new Template({}), req.query).then(
            result => {
                if (result.error) {
                    this.logger.E("could not read templates", result.error)
                    res.status(500).end()
                }

                const { page, pageSize, pageCount, rowCount, rows } = result
                this.logger.I("got templates", { rowCount, pageCount  })
                res.status(200).json({ rows, rowCount, page, pageSize, pageCount })
            }
        )
    }

    updateTemplate = (req: Request, res: Response) => {

        const updatePage = new Template(req.body)

        const logger = this.logger.C({ updatePage })
        logger.I("update template request")

        this.db.update(updatePage).then(
            result => {
                if (result.error) {
                    logger.E("failed to update template", result.error)
                    res.status(500).end()
                }

                logger.I("template updated successfully")
                res.status(200).end()
            }
        )
    }

    deleteTemplate = (req: Request, res: Response) => {

        const { id } = req.params
        this.logger.I("delete template request", { id })

        const parsedId = parseInt(id)
        if (isNaN(parsedId)) {
            this.logger.E("invalid id for template", "could not parse id", { id })
            res.status(400)
        }

        const logger = this.logger.C({ id: parsedId })

        this.db.delete(new Template({ id: parsedId })).then(
            result => {
                if (result.error) {
                    logger.E("failed to delete template", result.error)
                    res.status(500).end()
                }

                logger.I("template deleted successfully")
                res.status(200).end()
            }
        )
    }
}

