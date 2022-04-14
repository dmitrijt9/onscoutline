import { Player } from '../../entities/Player'

export type NewMatchRequest = {
    competition: string
    takePlace: string
    facrUuid: string
    homeTeam: string
    awayTeam: string
    homeTeamScore: number | null
    awayTeamScore: number | null
    homeTeamGoals: GoalRequest[]
    awayTeamGoals: GoalRequest[]
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
    yellowCardMinute: number | null
    redCardMinute: number | null
    substitution: string | null
    isInStartingLineup: boolean
    goals: GoalRequest[]
    side: 'home' | 'away'
}

export type PlayerWithMatchInfo = Player & {
    matchInfo: MatchPlayerRequest
}
