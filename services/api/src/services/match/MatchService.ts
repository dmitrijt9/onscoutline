import { Club } from '../../entities/Club'
import { Match } from '../../entities/Match'
import { Player } from '../../entities/Player'
import { PlayerInMatch } from '../../entities/Relations/PlayerInMatch'
import { ClubRepository } from '../../repositories/club/ClubRepository'
import { CompetitionRepository } from '../../repositories/competition/CompetitionRepository'
import { MatchRepository } from '../../repositories/match/MatchRepository'
import { PlayerInMatchRepository } from '../../repositories/player/PlayerInMatchRepository'
import { PlayerRepository } from '../../repositories/player/PlayerRepository'
import { fromFacrDateTime, toOnscoutlineDateFormat } from '../../utils/conversions'
import { CompetitionService } from '../competition/CompetitionService'
import { PlayerService } from '../player/PlayerService'
import { SeasonService } from '../season/SeasonService'
import { MatchPlayerRequest, NewMatchRequest, PlayerWithMatchInfo } from './types'

export class MatchService {
    constructor(
        private readonly seasonService: SeasonService,
        private readonly competitionRepository: CompetitionRepository,
        private readonly competitionService: CompetitionService,
        private readonly clubRepository: ClubRepository,
        private readonly playerRepository: PlayerRepository,
        private readonly playerService: PlayerService,
        private readonly matchRepository: MatchRepository,
        private readonly playerInMatchRepository: PlayerInMatchRepository,
    ) {}

    async createMatches(newMatchRequest: NewMatchRequest[]) {
        await Promise.all(
            newMatchRequest.map((newMatchRequest) => this.createMatch(newMatchRequest)),
        )
        // TODO: business logic
        // TODO: get competition
        // TODO: get season
        // TODO: validate clubs - if exists, if not, create without facrId etc.
        // TODO: validate players - if exists, if not, create without facrId etc.
        // TODO: prepare players - set stats, resolve current club etc.
        // TODO: prepare players stats
        // TODO: save match, player in match, player stats
    }

    private async createMatch(newMatchRequest: NewMatchRequest) {
        const matchTakePlace = fromFacrDateTime(newMatchRequest.takePlace)
        const matchSeason = await this.seasonService.getSeasonByDate(
            toOnscoutlineDateFormat(new Date(fromFacrDateTime(newMatchRequest.takePlace))),
        )

        const competition = await this.competitionRepository.findByName(newMatchRequest.competition)

        if (!competition) {
            // TODO: Custom error - to pass whole match request payload, so that I can retry to import this match somehow
            throw new Error('Could not find competition for this match.')
        }

        const competitionHasSeason = await this.competitionService.getCompetitionHasSeason(
            competition,
            matchSeason,
        )

        const homeClubName = newMatchRequest.homeTeam
        const awayClubName = newMatchRequest.awayTeam

        const homeClub = await this.getMatchClub(homeClubName)
        const awayClub = await this.getMatchClub(awayClubName)

        const homePlayers = await this.getMatchPlayers(newMatchRequest.lineups.home)
        const awayPlayers = await this.getMatchPlayers(newMatchRequest.lineups.away)

        // resolve current club for a players
        await this.playerService.resolvePlayersCurrentClubFromMatch(
            homePlayers,
            homeClub,
            matchTakePlace,
        )
        await this.playerService.resolvePlayersCurrentClubFromMatch(
            awayPlayers,
            awayClub,
            matchTakePlace,
        )

        const matchToSave: Omit<Match, 'id'> = {
            awayTeam: awayClub,
            homeTeam: homeClub,
            // * some matches does not have results...since I do not care about team results, 0 fallback is not problem for me
            scoreAway: newMatchRequest.awayTeamScore ?? 0,
            scoreHome: newMatchRequest.homeTeamScore ?? 0,
            when: matchTakePlace,
            competitionSeason: competitionHasSeason,
        }

        const match = await this.matchRepository.save(matchToSave)
        await this.savePlayerInMatchRelations([...homePlayers, ...awayPlayers], match)

        console.log(competitionHasSeason)
    }

    private async getMatchClub(clubName: string): Promise<Club> {
        const clubInDb = await this.clubRepository.findByName(clubName)

        return (
            clubInDb ??
            (await this.clubRepository.save({
                facrId: null,
                facrUuid: null,
                name: clubName,
            }))
        )
    }

    private async getMatchPlayers(
        playerRequests: MatchPlayerRequest[],
    ): Promise<PlayerWithMatchInfo[]> {
        const foundPlayersInDb = await this.playerRepository.findAllByFullname(
            playerRequests.map((player) => player.fullname),
        )

        if (foundPlayersInDb.length === playerRequests.length) {
            return foundPlayersInDb.map((player) => {
                const found = playerRequests.find(
                    (playerReq) => playerReq.fullname === `${player.surname} ${player.name}`,
                )

                // should not happen
                // TODO: add custom error
                if (!found) {
                    throw new Error('Unexpected error')
                }

                return {
                    ...player,
                    matchInfo: found,
                }
            })
        }

        // ! Will not work when two players have the same surname and name...
        // TODO: Solve issue with a duplicate names of different players
        const foundPlayersMap = foundPlayersInDb.reduce((map, player) => {
            map.set(`${player.surname} ${player.name}`, player)
            return map
        }, new Map())

        const missingPlayersInDb = playerRequests.filter((playerRequest) => {
            return !foundPlayersMap.get(playerRequest.fullname)
        })

        const newPlayersToSave: Omit<Player, 'id'>[] = missingPlayersInDb.map((player) => {
            return {
                facrId: null,
                // * Notice: We set fullname as a name. There is no way to distinguish between name and surname generally.
                // * Especially when non-czech name appears.
                name: player.fullname,
                surname: '',
                yearOfBirth: null,
            }
        })
        const newPlayersWithoutFacrId: Player[] = await this.playerRepository.save(newPlayersToSave)
        return [...foundPlayersInDb, ...newPlayersWithoutFacrId].map((player) => {
            const found = playerRequests.find(
                (playerReq) => playerReq.fullname === `${player.surname} ${player.name}`,
            )

            // should not happen
            // TODO: add custom error
            if (!found) {
                throw new Error('Unexpected error')
            }

            return {
                ...player,
                matchInfo: found,
            }
        })
    }

    private async savePlayerInMatchRelations(
        players: PlayerWithMatchInfo[],
        match: Match,
    ): Promise<PlayerInMatch[]> {
        const relations: Omit<PlayerInMatch, 'id'>[] = players.map((player) => {
            return {
                match,
                playedFromMinute: player.matchInfo.isInStartingLineup
                    ? 0
                    : player.matchInfo.substitution
                    ? parseInt(player.matchInfo.substitution)
                    : null,
                player,
            }
        })

        return await this.playerInMatchRepository.save(relations)
    }

    // private sync savePlayerStats
}
