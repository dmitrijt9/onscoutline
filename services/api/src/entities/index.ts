import { Club } from './Club'
import { Competition } from './Competition'
import { Match } from './Match'
import { Player } from './Player'
import { PlayerInClub } from './Relations/PlayerInClub'
import { PlayerInMatch } from './Relations/PlayerInMatch'

export const entities = [Club, Competition, Player, PlayerInClub, Match, PlayerInMatch]
