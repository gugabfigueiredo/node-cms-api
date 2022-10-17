import {Request, Response} from "express";
import {Database} from "../database";
import {ContentPage} from "../model/model";
import {Logger} from "mini-ts-logger";

export class ContentHandler {

    constructor(public db: Database, public logger: Logger) {}


    createContentPage(req: Request, res: Response) {
    }

    readContentPage(req: Request, res: Response) {
        const { id } = req.params
        const parsedId = parseInt(id)
        if (isNaN(parsedId)) {
            this.logger.E("invalid id for content page", "could not parse id", { id })
            res.status(400)
        }
        this.db.read(new ContentPage({ id: parsedId }))
            .then(
                result => {
                    if (result.error) {
                        this.logger.E("could not read content page", result.error, { id: parsedId })
                        res.status(500)
                    }

                    const contentPage = result.rows[0]

                    this.logger.I("got content page", { page: contentPage.name })
                }
            )

    }

    readContentPages(req: Request, res: Response) {

    }

    updateContentPage(req: Request, res: Response) {

    }   
}

