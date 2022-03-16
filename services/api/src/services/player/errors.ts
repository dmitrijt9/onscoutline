import { BaseError } from '../../dependency/errors/index'

export class NewPlayerClubNotFound extends BaseError {
    constructor(
        club: string,
        message = `Player service: Could not find the club ${club} while processing new players.`,
    ) {
        super({
            message,
            payload: {
                club,
            },
        })
    }
}
