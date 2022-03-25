export type NewMatchRequest = {
    competition: string
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
    yellowCard: boolean
    redCard: boolean
    substitution: string
    isInStartingLineup: boolean
}
