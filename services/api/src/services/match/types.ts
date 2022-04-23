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
    yellowCardMinutes: number[] | null
    redCardMinute: number | null
    substitution: string | null
    isInStartingLineup: boolean
    goals: GoalRequest[]
    side: 'home' | 'away'
}

export type PlayerWithMatchInfo = Player & {
    matchInfo: MatchPlayerRequest
}
