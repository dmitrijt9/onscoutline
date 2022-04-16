import { UnexpectedError } from '../../dependency/errors/index'

export class UnexpectedMatchServiceError extends UnexpectedError {
    constructor(message, payload?: any) {
        super({
            message,
            payload,
        })
    }
}
