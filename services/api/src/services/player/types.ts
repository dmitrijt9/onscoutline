import { Gender, Player } from '../../entities/Player'
import { ISO8601_NoTime } from '../../entities/types'

export type NewPlayerRequest = {
    facrId: string

    name: string

    surname: string

    dateOfBirth: string

    facrMemberFrom?: ISO8601_NoTime

    gender: Gender

    country: string

    parentClub: {
        clubFacrId: string
        playingFrom: ISO8601_NoTime
    }

    loanClub: {
        clubFacrId: string
        playingFrom: ISO8601_NoTime
        playingUntil: ISO8601_NoTime
    } | null

    transfersRecords: {
        when: ISO8601_NoTime
        event: string
        clubFrom: string
        clubTo: string | null
        period: {
            from: ISO8601_NoTime
            to: ISO8601_NoTime
        } | null
    }[]
}

export type PlayerToUpdate = Player
