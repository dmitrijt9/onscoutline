import { randomUUID } from 'crypto'
import { NextFunction, Request, Response } from 'express'
import { ApplicationContext, ILogger } from '../../services/logger/ILogger'
import { getErrorMessage } from '../../utils/errors/index'
import { BaseError, SevereError } from './index'

export const createCustomErrorHandler =
    (logger: ILogger) => (error: unknown, req: Request, res: Response, _: NextFunction) => {
        const appContext: ApplicationContext = {
            request: {
                id: randomUUID(),
                source: {
                    hostname: req.hostname,
                    originalUrl: req.originalUrl,
                },
                data: JSON.stringify(req.body),
                headers: req.headers,
            },
        }

        if (error instanceof BaseError) {
            const inferedErrorStatus = inferErrorCode(error)
            const explicitErrorStatus = error.payload?.statusCode || null

            if (error instanceof SevereError) {
                logger.error(error, appContext)
            }

            // if (error instanceof NonCriticalError) {
            //     logger.warn(error, appContext)
            // }

            return res.status(explicitErrorStatus ?? inferedErrorStatus).send({
                code: error.type,
                message: error.message,
                ...(error.payload?.description && { description: error.payload.description }),
            })
        }

        // Thrown when JSON request body is invalid
        if (error instanceof SyntaxError) {
            return res.status(400).send({
                code: 'SyntaxError',
                message: 'Syntax error occured. Check the request body.',
                error: getErrorMessage(error),
            })
        }

        if (error instanceof Error) {
            // This will potentially log more info than the getErrorMessage function lower
            logger.error(error, appContext)
        } else {
            logger.error(getErrorMessage(error), appContext)
        }

        return res.status(500).send({
            code: 'UnexpectedError',
            message: 'Unexpected, unknown origin error has occurred',
            error: getErrorMessage(error),
        })
    }

const inferErrorCode = (error: unknown): number => {
    // if (error instanceof InputError) {
    //     return 400
    // }

    // if (error instanceof UnauthorizedError) {
    //     return 401
    // }

    // if (error instanceof InputNotFoundError) {
    //     return 404
    // }

    return 500
}
