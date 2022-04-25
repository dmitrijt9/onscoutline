import { Match } from '../../entities/Match'
import { Player, PlayerPosition } from '../../entities/Player'
import { PlayerGameStatistic, StatType } from '../../entities/PlayerGameStatistic'
import { PlayerInMatch } from '../../entities/Relations/PlayerInMatch'
import { ClubRepository } from '../../repositories/club/ClubRepository'
import { PlayerInClubRepository } from '../../repositories/player/PlayerInClubRepository'
import { PlayerInMatchRepository } from '../../repositories/player/PlayerInMatchRepository'
import { PlayerRepository } from '../../repositories/player/PlayerRepository'
import { PlayerGameStatisticRepository } from '../../repositories/statistic/PlayerGameStatisticRepository'
import { isNil } from '../../utils/index'
import { ILogger } from '../logger/ILogger'
import { MatchPlayerRequest, PlayerWithMatchInfo } from '../match/types'
import { StatisticsService } from '../statistics/StatisticsService'
import { NewPlayerRequest, PlayerInClubRequest, PlayerInClubToSave } from './types'
import { In } from 'typeorm'

export class PlayerService {
    constructor(
        private readonly playerRepository: PlayerRepository,
        private readonly playerInClubRepository: PlayerInClubRepository,
        private readonly playerInMatchRepository: PlayerInMatchRepository,
        private readonly clubRepository: ClubRepository,
        private readonly statisticsService: StatisticsService,
        private readonly playerGamestatisticRepository: PlayerGameStatisticRepository,
        private readonly logger: ILogger,
    ) {}

    async processNewPlayersOfClub(newPlayers: NewPlayerRequest[]): Promise<Player[]> {
        const foundPlayers = await this.playerRepository.find({
            where: {
                facrId: In(newPlayers.map((np) => np.facrId)),
            },
        })

        const foundPlayersMap: Map<string, Player> = foundPlayers.reduce(
            (map: Map<string, Player>, player: Player) => {
                if (player.facrId) {
                    map.set(player.facrId, player)
                }

                return map
            },
            new Map(),
        )

        const playersToUpdate: PlayerInClubRequest[] = newPlayers
            .filter((newPlayer) => {
                return !!foundPlayersMap.get(newPlayer.facrId)
            })
            .map((np) => {
                return {
                    // should be ok, as I filtered them above
                    ...(foundPlayersMap.get(np.facrId) as Player),
                    name: np.name,
                    surname: np.surname,
                    dateOfBirth: np.dateOfBirth,
                    facrMemberFrom: np.facrMemberFrom,
                    country: np.country,
                    gender: np.gender,
                    parentClub: np.parentClub,
                    loanClub: np.loanClub,
                    transferRecords: np.transfersRecords,
                }
            })

        const playersToSave: Omit<PlayerInClubRequest, 'id'>[] = newPlayers
            .filter((newPlayer) => {
                return foundPlayersMap.get(newPlayer.facrId) ? false : true
            })
            .map((newPlayer) => {
                return {
                    facrId: newPlayer.facrId,
                    name: newPlayer.name,
                    surname: newPlayer.surname,
                    dateOfBirth: newPlayer.dateOfBirth,
                    facrMemberFrom: newPlayer.facrMemberFrom,
                    country: newPlayer.country,
                    gender: newPlayer.gender,
                    transferRecords: newPlayer.transfersRecords,
                    parentClub: newPlayer.parentClub,
                    loanClub: newPlayer.loanClub,
                }
            })

        const savedPlayers = await this.playerRepository.save([
            ...playersToSave,
            ...playersToUpdate,
        ])

        // save relation of each player with his parent or loan club
        await this.savePlayerInClubRelations(savedPlayers)
        console.log('saved players: ', playersToSave.length)
        console.log('updated players: ', playersToUpdate.length)

        return savedPlayers
    }

    private async getClubByFacrId(facrId: string, name: string) {
        const club = await this.clubRepository.findOne({
            where: {
                facrId,
            },
        })

        return (
            club ??
            (await this.clubRepository.save({
                facrId,
                name,
            }))
        )
    }

    private async savePlayerInClubRelations(players: PlayerInClubRequest[]) {
        for (const player of players) {
            const parentClubReq = player.parentClub
            const loanClubReq = player.loanClub

            const parentClub = await this.getClubByFacrId(
                parentClubReq.clubFacrId,
                parentClubReq.clubName,
            )

            const relationsToSave: PlayerInClubToSave[] = []
            const existingParentClubRelation = await this.playerInClubRepository.findOne({
                where: {
                    player,
                    club: parentClub,
                    isOnLoan: false,
                    playingFrom: parentClubReq.playingFrom,
                },
            })

            if (!existingParentClubRelation) {
                relationsToSave.push({
                    club: parentClub,
                    player,
                    isOnLoan: false,
                    playingFrom: parentClubReq.playingFrom,
                })
            }

            if (loanClubReq) {
                const loanClub = await this.getClubByFacrId(
                    loanClubReq.clubFacrId,
                    loanClubReq.clubName,
                )
                const existingLoanClubRelation = await this.playerInClubRepository.findOne({
                    where: {
                        player,
                        club: loanClub,
                        playingFrom: loanClubReq.playingFrom,
                        isOnLoan: true,
                    },
                })

                if (!existingLoanClubRelation) {
                    relationsToSave.push({
                        player,
                        club: loanClub,
                        isOnLoan: true,
                        playingFrom: loanClubReq.playingFrom,
                        playingUntil: loanClubReq.playingUntil,
                    })
                }
            }

            if (!isNil(player.transferRecords)) {
                for (const record of player.transferRecords) {
                    const clubFromFacrId = record.clubFrom.split(' - ').shift()
                    const clubFrom = await this.clubRepository.findOne({
                        where: {
                            facrId: clubFromFacrId,
                        },
                    })

                    if (isNil(clubFrom)) {
                        this.logger.warn(
                            `FACR Players Scraper: Failed to find a club ${record.clubFrom}`,
                        )
                        continue
                    }

                    const clubToFacrId = record.clubTo ? record.clubTo.split(' - ').shift() : null
                    const clubTo = clubToFacrId
                        ? await this.clubRepository.findOne({
                              where: {
                                  facrId: clubToFacrId,
                              },
                          })
                        : null

                    const isOnLoan = record.event.includes('Hostování')
                    const playingFrom = record.period ? record.period.from : record.when
                    const playingUntil = record.period?.to

                    const existingRelation = await this.playerInClubRepository.findOne({
                        where: {
                            player,
                            club: isOnLoan && clubTo ? clubTo : clubFrom,
                            playingFrom,
                            playingUntil,
                            isOnLoan,
                        },
                    })

                    if (isNil(existingRelation)) {
                        relationsToSave.push({
                            player,
                            club: isOnLoan && clubTo ? clubTo : clubFrom,
                            playingFrom,
                            playingUntil,
                            isOnLoan,
                        })
                    }
                }
            }

            await this.playerInClubRepository.save(relationsToSave)
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

            const playerStats = this.getPlayerStatsFromMatch(player, {
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

            // update player`s shirt number and positions
            const playerPosition = this.facrPositionToPlayerPosition(player.matchInfo.position)
            const playersCurrentPositionsSet = new Set(player.positions)
            if (!isNil(playerPosition)) {
                playersCurrentPositionsSet.add(playerPosition)
            }
            const playerShirt = player.matchInfo.shirt
            await this.playerRepository.update(player.id, {
                positions: [...playersCurrentPositionsSet],
                shirtNumber: playerShirt,
            })
        }
    }

    private getPlayerStatsFromMatch(
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

        const notOwnGoals = goals.filter(
            (g) => g.statType === StatType.RegularGoal || g.statType === StatType.PenaltyGoal,
        )

        if (notOwnGoals.length >= 3) {
            stats.push({
                minute: null,
                statType: StatType.Hattrick,
                value: 1,
            })
        }

        if (!isNil(player.matchInfo.yellowCardMinutes)) {
            for (const yellowCardMinute of player.matchInfo.yellowCardMinutes) {
                stats.push({
                    minute: yellowCardMinute,
                    statType: StatType.YellowCard,
                    value: 1,
                })
            }
        }

        if (!isNil(player.matchInfo.redCardMinute)) {
            stats.push({
                minute: player.matchInfo.redCardMinute,
                statType: StatType.RedCard,
                value: 1,
            })
        }

        if (!isNil(player.matchInfo.substitution)) {
            stats.push({
                minute: +player.matchInfo.substitution,
                statType: StatType.Substitution,
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
