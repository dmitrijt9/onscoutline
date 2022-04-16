import { Player } from '../../entities/Player'
import { ISO8601, ISO8601_NoTime } from '../../entities/types'

export type NewPlayerRequest = {
    facrId: string

    name: string

    surname: string

    yearOfBirth: string

    facrMemberFrom?: ISO8601_NoTime

    playingFrom: ISO8601_NoTime
}

export type PlayerToUpdate = Player & {
    playingFrom: ISO8601
}
