import { Club } from './Club'
import { Competition } from './Competition'
import { FailedNewMatchRequest } from './FailedNewMatchRequest'
import { Match } from './Match'
import { Player } from './Player'
import { PlayerGameStatistic } from './PlayerGameStatistic'
import { CompetitionHasSeason } from './Relations/CompetitionHasSeason'
import { PlayerInClub } from './Relations/PlayerInClub'
import { PlayerInMatch } from './Relations/PlayerInMatch'
import { Season } from './Season'

export const entities = [
    Club,
    Competition,
    Player,
    PlayerInClub,
    Match,
    PlayerInMatch,
    Season,
    CompetitionHasSeason,
    PlayerGameStatistic,
    FailedNewMatchRequest,
]
