import { Club } from '../../entities/Club'
import { Gender, Player, Transfer } from '../../entities/Player'
import { PlayerInClub } from '../../entities/Relations/PlayerInClub'
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
        clubName: string
        playingFrom: ISO8601_NoTime
    }

    loanClub: {
        clubFacrId: string
        clubName: string
        playingFrom: ISO8601_NoTime
        playingUntil: ISO8601_NoTime
    } | null

    transfersRecords: Transfer[]
}

export type PlayerToUpdate = Player

export type PlayerInClubToSave = Omit<PlayerInClub, 'id'>

export type PlayerInClubRequest = Player & {
    parentClub: NewPlayerRequest['parentClub']
    loanClub: NewPlayerRequest['loanClub']
}
