import { Club } from '../../entities/Club'
import { Match } from '../../entities/Match'
import { Player, PlayerPosition } from '../../entities/Player'
import { PlayerGameStatistic, StatType } from '../../entities/PlayerGameStatistic'
import { PlayerInMatch } from '../../entities/Relations/PlayerInMatch'
import { ISO8601_NoTime } from '../../entities/types'
import { ClubRepository } from '../../repositories/club/ClubRepository'
import { PlayerInClubRepository } from '../../repositories/player/PlayerInClubRepository'
import { PlayerInMatchRepository } from '../../repositories/player/PlayerInMatchRepository'
import { PlayerRepository } from '../../repositories/player/PlayerRepository'
import { PlayerGameStatisticRepository } from '../../repositories/statistic/PlayerGameStatisticRepository'
import { isNil } from '../../utils/index'
import { MatchPlayerRequest, PlayerWithMatchInfo } from '../match/types'
import { StatisticsService } from '../statistics/StatisticsService'
import { NewPlayerClubNotFound } from './errors'
import { NewPlayerRequest, PlayerToUpdate } from './types'

export class PlayerService {
    constructor(
        private readonly playerRepository: PlayerRepository,
        private readonly playerInClubRepository: PlayerInClubRepository,
        private readonly playerInMatchRepository: PlayerInMatchRepository,
        private readonly clubRepository: ClubRepository,
        private readonly statisticsService: StatisticsService,
        private readonly playerGamestatisticRepository: PlayerGameStatisticRepository,
    ) {}

    async processNewPlayersOfClub(
        newPlayers: NewPlayerRequest[],
        clubFacrId: string,
    ): Promise<Player[]> {
        const club = await this.clubRepository.findByFacrId(clubFacrId)

        if (!club) {
            throw new NewPlayerClubNotFound(clubFacrId)
        }

        const currentPlayers = await this.playerRepository.find()
        const currentPlayersMap: Map<string, Player> = currentPlayers.reduce(
            (map: Map<string, Player>, player: Player) => {
                if (player.facrId) {
                    map.set(player.facrId, player)
                }

                return map
            },
            new Map(),
        )

        const playersToInsert = newPlayers.filter(({ facrId }) => !currentPlayersMap.get(facrId))

        const playersToUpdate: PlayerToUpdate[] = newPlayers
            .filter(({ facrId }) => currentPlayersMap.get(facrId))
            .map(({ facrId, playingFrom }) => {
                return {
                    ...(currentPlayersMap.get(facrId) as Player),
                    playingFrom,
                }
            })

        const savedPlayers: Player[] = await this.playerRepository
            .save(playersToInsert)
            .finally(() => {
                console.log(
                    `Player Service: Successfully saved ${playersToInsert.length} new players.`,
                )
            })

        await this.playerInClubRepository.save(
            savedPlayers.map((player) => {
                return {
                    player: {
                        id: player.id,
                    },
                    club: {
                        id: club.id,
                    },
                    playingFrom: playersToInsert.find((p) => p.facrId === player.facrId)
                        ?.playingFrom,
                }
            }),
        )

        // check for existing players club changes
        for (const player of playersToUpdate) {
            const relations = await this.playerInClubRepository.find({
                where: {
                    club: {
                        id: club.id,
                    },
                    player: {
                        id: player.id,
                    },
                },
            })

            if (!relations.length) {
                await this.playerInClubRepository.save({
                    player: {
                        id: player.id,
                    },
                    club: {
                        id: club.id,
                    },
                    playingFrom: player.playingFrom,
                })
            } else {
                const sortedRalations = relations.sort(
                    (a, b) => new Date(a.playingFrom).getTime() - new Date(b.playingFrom).getTime(),
                )
                if (sortedRalations[0].playingFrom < player.playingFrom) {
                    await this.playerInClubRepository.save({
                        player: {
                            id: player.id,
                        },
                        club: {
                            id: club.id,
                        },
                        playingFrom: player.playingFrom,
                    })
                }
            }
        }

        return savedPlayers
    }

    async resolvePlayersCurrentClubFromMatch(
        players: Player[],
        appearedInClub: Club,
        appearedInClubDate: ISO8601_NoTime,
    ) {
        for (const player of players) {
            const lastPlayerInClubRelation =
                await this.playerInClubRepository.findLastByPlayerAndClub(player, appearedInClub)

            if (!lastPlayerInClubRelation) {
                await this.playerInClubRepository.save({
                    club: appearedInClub,
                    player,
                    playingFrom: appearedInClubDate,
                    isOnLoan: false,
                })
                continue
            }

            if (lastPlayerInClubRelation.club.id === appearedInClub.id) {
                continue
            }

            await this.playerInClubRepository.save({
                club: appearedInClub,
                player,
                playingFrom: appearedInClubDate,
                isOnLoan: true,
            })
        }
    }

    /**
     * Processes player in match specific tasks, e.g. save playerInMatch relation, calculate stats and save them
     * @param players
     * @param match
     * @param matchInfo
     */
    async resolvePlayersInMatch(players: PlayerWithMatchInfo[], match: Match) {
        const getMatchSideGoals = (side: 'home' | 'away', playersMatchInfo: MatchPlayerRequest[]) =>
            playersMatchInfo
                .filter((player) => player.goals.length > 0 && player.side === side)
                .map((goalscorer) => goalscorer.goals)
                .flat()

        const playersMatchInfos = players.map(({ matchInfo }) => matchInfo)
        const awayTeamGoalsMinutes = getMatchSideGoals('away', playersMatchInfos)
        const homeTeamGoalsMinutes = getMatchSideGoals('home', playersMatchInfos)

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
                homeTeamGoals: homeTeamGoalsMinutes,
                awayTeamGoals: awayTeamGoalsMinutes,
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

    private calculatePlayerStatsFromMatch(
        player: PlayerWithMatchInfo,
        matchInfo: {
            homeTeamGoals: { type: string; minute: number }[]
            awayTeamGoals: { type: string; minute: number }[]
        },
    ): Omit<PlayerGameStatistic, 'id' | 'playerInMatch'>[] {
        const playerSubstitutionMinute = player.matchInfo.substitution
        const playingFromMinute = player.matchInfo.isInStartingLineup ? 0 : playerSubstitutionMinute

        if (isNil(playingFromMinute)) {
            return []
        }

        const stats: Omit<PlayerGameStatistic, 'id' | 'playerInMatch'>[] = []

        // TODO: Enum for player positions
        const playerPosition = player.matchInfo.position
        if (playerPosition === 'Brankář') {
            const oppositeTeamGoals =
                player.matchInfo.side === 'away' ? matchInfo.homeTeamGoals : matchInfo.awayTeamGoals
            const concededGoalsCount = oppositeTeamGoals.filter(
                ({ minute, type }) => minute >= +playingFromMinute && type !== 'Vlastní',
            ).length

            stats.push({
                minute: null,
                statType: StatType.ConcededGoals,
                value: concededGoalsCount,
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

    /**
     * Converts FACR player positions to an app's enum PlayerPosition value
     *
     * All unknown position types will be tracked as null
     * @param facrPosition Positions from FACR database, e.g. Brankar, Obrance etc.
     * @returns
     */
    facrPositionToPlayerPosition(facrPosition: string): PlayerPosition | null {
        const positionsMap: Map<string, PlayerPosition> = new Map([
            ['Brankář', PlayerPosition.Goalkeeper],
            ['Obránce', PlayerPosition.Defender],
            ['Záložník', PlayerPosition.Midfielder],
            ['Útočník', PlayerPosition.Forward],
        ])

        return positionsMap.get(facrPosition) ?? null
    }
}
