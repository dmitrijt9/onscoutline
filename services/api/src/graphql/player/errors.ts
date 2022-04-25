import { BaseError } from '../../dependency/errors/index'

export class PlayerNotFound extends BaseError {
    constructor(playerId: number, message = `Player with id ${playerId} was not found.`) {
        super({
            message,
            payload: {
                statusCode: 404,
                playerId,
            },
        })
    }
}
