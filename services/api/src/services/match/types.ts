import { Player } from '../../entities/Player'

export type NewMatchRequest = {
    competition: string
    takePlace: string
    facrUuid: string
    homeTeam: string
    awayTeam: string
    homeTeamScore: number | null
    awayTeamScore: number | null
    lineups: LineupsRequest
}

type GoalRequest = {
    minute: number
    type: string
}

type LineupsRequest = {
    home: MatchPlayerRequest[]
    away: MatchPlayerRequest[]
}

export type MatchPlayerRequest = {
    shirt: number
    position: string
    fullname: string
    yellowCard: boolean
    redCard: boolean
    substitution: string | null
    isInStartingLineup: boolean
    goals: GoalRequest[]
}

export type PlayerWithMatchInfo = Player & {
    matchInfo: MatchPlayerRequest
}
