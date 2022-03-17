import { Club } from './Club'
import { Competition } from './Competition'
import { Match } from './Match'
import { Player } from './Player'
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
]
