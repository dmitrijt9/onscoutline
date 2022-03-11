export type NewMatchRequest = {
    takePlace: string
    facrUuid: string
    homeTeam: string
    awayTeam: string
    homeTeamScore: number | null
    awayTeamScore: number | null
    goalScorers?: GoalScorerRequest[]
    lineups: LineupsRequest
}

type GoalScorerRequest = {
    player: string
    minute: number
    assistPlayer?: string
    type: string
    team: string
}

type LineupsRequest = {
    home: MatchPlayerRequest[]
    away: MatchPlayerRequest[]
}

type MatchPlayerRequest = {
    shirt: number
    position: string
    fullname: string
    yellowCards: number
    redCards: number
    substitutionMinute: number
    isInStartingLineup: boolean
}
