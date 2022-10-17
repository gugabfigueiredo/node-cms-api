/** source/index.ts */
import express, {Express, Router} from 'express';
import morgan from 'morgan';

export const Route = (route: (r: Router) => void) : Router => {
    const router = Router({mergeParams: true})
    route(router)
    return router
}

export const Server = (context: string, router: Router ): Express => {
    const server: Express = express();

    /** Logging */
    server.use(morgan('dev'));
    /** Parse the request */
    server.use(express.urlencoded({ extended: false }));
    /** Takes care of JSON data */
    server.use(express.json());

    /** RULES OF OUR API */
    server.use((req, res, next) => {
        // set the CORS policy
        res.header('Access-Control-Allow-Origin', '*');
        // set the CORS headers
        res.header('Access-Control-Allow-Headers', 'origin, X-Requested-With,Content-Type,Accept, Authorization');
        // set the CORS method headers
        if (req.method === 'OPTIONS') {
            res.header('Access-Control-Allow-Methods', 'GET PATCH DELETE POST');
            return res.status(200).json({});
        }
        next();
    });

    server.use(context, router)

    /** Error handling */
    server.use((req, res, next) => {
        const error = new Error('not found');
        return res.status(404).json({
            message: error.message
        });
    });

    return server
}