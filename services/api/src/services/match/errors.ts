import { BaseError, UnexpectedError } from '../../dependency/errors/index'

export class UnexpectedMatchServiceError extends UnexpectedError {
    constructor(message, payload?: Record<string, unknown>) {
        super({
            message,
            payload,
        })
    }
}

export class MatchClubNotFound extends BaseError {
    constructor(
        clubName: string,
        message = `Club ${clubName}, which appeared in a match, was not found.`,
        payload?: Record<string, unknown>,
    ) {
        super({
            message,
            payload,
        })
    }
}
