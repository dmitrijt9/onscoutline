import { Player } from '../../entities/Player'
import { ISO8601 } from '../../entities/types'

export type NewPlayerRequest = Omit<Player, 'id'> & {
    playingFrom: ISO8601
}

export type PlayerToUpdate = Player & {
    playingFrom: ISO8601
}
