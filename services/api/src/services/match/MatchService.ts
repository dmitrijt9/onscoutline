import { Club } from '../../entities/Club'
import { Match } from '../../entities/Match'
import { Player } from '../../entities/Player'
import { PlayerGameStatistic, StatType } from '../../entities/PlayerGameStatistic'
import { PlayerInMatch } from '../../entities/Relations/PlayerInMatch'
import { ClubRepository } from '../../repositories/club/ClubRepository'
import { CompetitionRepository } from '../../repositories/competition/CompetitionRepository'
import { MatchRepository } from '../../repositories/match/MatchRepository'
import { PlayerInMatchRepository } from '../../repositories/player/PlayerInMatchRepository'
import { PlayerRepository } from '../../repositories/player/PlayerRepository'
import { PlayerGameStatisticRepository } from '../../repositories/statistic/PlayerGameStatisticRepository'
import { fromFacrDateTime, toOnscoutlineDateFormat } from '../../utils/conversions'
import { CompetitionService } from '../competition/CompetitionService'
import { PlayerService } from '../player/PlayerService'
import { SeasonService } from '../season/SeasonService'
import { StatisticsService } from '../statistics/StatisticsService'
import { UnexpectedMatchServiceError } from './errors'
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
        private readonly playerGamestatisticRepository: PlayerGameStatisticRepository,
        private readonly statisticsService: StatisticsService,
    ) {}

    async createMatches(newMatchRequest: NewMatchRequest[]) {
        await Promise.all(
            newMatchRequest.map((newMatchRequest) => this.createMatch(newMatchRequest)),
        )
    }

    private async createMatch(newMatchRequest: NewMatchRequest) {
        const matchTakePlace = fromFacrDateTime(newMatchRequest.takePlace)
        const matchSeason = await this.seasonService.getSeasonByDate(
            toOnscoutlineDateFormat(new Date(fromFacrDateTime(newMatchRequest.takePlace))),
        )

        const competition = await this.competitionRepository.findByName(newMatchRequest.competition)

        if (!competition) {
            throw new UnexpectedMatchServiceError(
                'Could not find competition for this match.',
                newMatchRequest,
            )
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

        // resolve current club for a players
        // TODO: remove after implementing scraping player detail with transfers from FACR database
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

        await this.resolvePlayersInMatch([...homePlayers, ...awayPlayers], match, newMatchRequest)
    }

    /**
     * Processes player in match specific tasks, e.g. save playerInMatch relation, calculate stats and save them
     * @param players
     * @param match
     * @param matchInfo
     */
    private async resolvePlayersInMatch(
        players: PlayerWithMatchInfo[],
        match: Match,
        matchInfo: NewMatchRequest,
    ) {
        for (const player of players) {
            const playerSubstitutionMinute = player.matchInfo.substitution
            const playingFromMinute = player.matchInfo.isInStartingLineup
                ? 0
                : playerSubstitutionMinute

            const playerInMatchRelation: Omit<PlayerInMatch, 'id'> = {
                playedFromMinute: playingFromMinute === null ? null : +playingFromMinute,
                match,
                player,
            }

            const playerStats = this.calculatePlayerStatsFromMatch(player, {
                awayTeamGoals: matchInfo.awayTeamGoals.map(({ minute }) => minute),
                homeTeamGoals: matchInfo.homeTeamGoals.map(({ minute }) => minute),
            })

            // save record about player being in match lineup
            const savedRelation = await this.playerInMatchRepository.save(playerInMatchRelation)

            // save player's calculated stats from the match
            await this.playerGamestatisticRepository.save(
                playerStats.map((stat) => {
                    return {
                        ...stat,
                        playerInMatch: savedRelation,
                    }
                }),
            )
        }
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
                if (!found) {
                    throw new UnexpectedMatchServiceError(
                        'Could not find linked player in a match lineup.',
                        {
                            playerFromDb: player,
                            lineup: playerRequests,
                        },
                    )
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
            const playerPosition = this.playerService.facrPositionToPlayerPosition(player.position)
            return {
                facrId: null,
                // * Notice: We set fullname as a name. There is no way to distinguish between name and surname generally.
                // * Especially when non-czech name appears.
                name: player.fullname,
                surname: '',
                yearOfBirth: null,
                position: playerPosition ? new Set([playerPosition]) : undefined,
            }
        })
        const newPlayersWithoutFacrId: Player[] = await this.playerRepository.save(newPlayersToSave)
        return [...foundPlayersInDb, ...newPlayersWithoutFacrId].map((player) => {
            const found = playerRequests.find(
                (playerReq) => playerReq.fullname === `${player.surname} ${player.name}`,
            )

            // should not happen
            if (!found) {
                throw new UnexpectedMatchServiceError(
                    'Could not find linked player in a match lineup.',
                    {
                        playerFromDb: player,
                        lineup: playerRequests,
                    },
                )
            }

            return {
                ...player,
                matchInfo: found,
            }
        })
    }

    private calculatePlayerStatsFromMatch(
        player: PlayerWithMatchInfo,
        matchInfo: {
            homeTeamGoals: number[]
            awayTeamGoals: number[]
        },
    ): Omit<PlayerGameStatistic, 'id' | 'playerInMatch'>[] {
        const playerSubstitutionMinute = player.matchInfo.substitution
        const playingFromMinute = player.matchInfo.isInStartingLineup ? 0 : playerSubstitutionMinute

        if (!playingFromMinute) {
            return []
        }

        const stats: Omit<PlayerGameStatistic, 'id' | 'playerInMatch'>[] = []

        // TODO: Enum for player positions
        const playerPosition = player.matchInfo.position
        if (playerPosition === 'Brankář') {
            const concededGoalsMinutes =
                player.matchInfo.side === 'away' ? matchInfo.homeTeamGoals : matchInfo.awayTeamGoals
            const concededGoals = concededGoalsMinutes.filter(
                (concededGoalMinute) => concededGoalMinute >= +playingFromMinute,
            ).length

            stats.push({
                minute: null,
                statType: StatType.ConcededGoals,
                value: concededGoals,
            })
        }

        const goals: Omit<PlayerGameStatistic, 'id' | 'playerInMatch'>[] =
            player.matchInfo.goals.map(({ minute, type }) => {
                return {
                    minute,
                    statType: this.statisticsService.facrGoalTypeToStatType(type),
                    value: 1,
                }
            })

        stats.push(...goals)

        if (player.matchInfo.yellowCardMinute) {
            stats.push({
                minute: player.matchInfo.yellowCardMinute,
                statType: StatType.YellowCard,
                value: 1,
            })
        }

        if (player.matchInfo.redCardMinute) {
            stats.push({
                minute: player.matchInfo.redCardMinute,
                statType: StatType.RedCard,
                value: 1,
            })
        }

        return stats
    }
}
