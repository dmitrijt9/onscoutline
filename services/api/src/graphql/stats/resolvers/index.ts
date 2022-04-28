import { StatType } from '../../../entities/PlayerGameStatistic'
import { isNil } from '../../../utils/index'
import { PlayerNotFound } from '../../player/errors'
import { GraphqlContext } from '../../types'
import { PlayerStat } from '../enums'
import { PlayerStatBySeason } from '../input-types/player-stat-by-season'
import { StatBySeason } from '../object-types/stat-by-season'
import { Args, Ctx, Query, Resolver } from 'type-graphql'

@Resolver()
export class StatResolver {
    @Query(() => [StatBySeason])
    async playerStats(
        @Args()
        { playerId, stat }: PlayerStatBySeason,
        @Ctx()
        { container }: GraphqlContext,
    ): Promise<StatBySeason[]> {
        const player = await container.playerRepository.findOne(playerId)
        if (!player) {
            throw new PlayerNotFound(playerId)
        }

        if (stat === PlayerStat.StartingEleventCount) {
            const startingEl =
                await container.playerInMatchRepository.findStartingElevenCountGroupedBySeasons(
                    playerId,
                )
            return startingEl.map((se) => {
                return {
                    season: se.season,
                    value: se.count,
                }
            })
        }

        if (stat === PlayerStat.PlayedMatches) {
            const playedMatches =
                await container.playerInMatchRepository.findPlayedMatchesCountGroupedBySeasons(
                    playerId,
                )
            return playedMatches.map((pm) => {
                return {
                    season: pm.season,
                    value: pm.count,
                }
            })
        }

        if (stat === PlayerStat.CleanSheets) {
            const cleanSheets =
                await container.playerGameStatisticsRepository.findCleanSheetsCountGroupedBySeason(
                    playerId,
                )

            return cleanSheets.map((cs) => {
                return {
                    season: cs.season,
                    value: cs.count,
                }
            })
        }

        if (stat === PlayerStat.ConcededGoals) {
            return await container.playerGameStatisticsRepository.findStatSumForAllSeasons(
                playerId,
                StatType.ConcededGoals,
            )
        }

        if (stat === PlayerStat.Hattricks) {
            return await container.playerGameStatisticsRepository.findStatSumForAllSeasons(
                playerId,
                StatType.Hattrick,
            )
        }

        if (stat === PlayerStat.OwnGoals) {
            return await container.playerGameStatisticsRepository.findStatSumForAllSeasons(
                playerId,
                StatType.OwnGoal,
            )
        }

        if (stat === PlayerStat.PenaltyGoals) {
            return await container.playerGameStatisticsRepository.findStatSumForAllSeasons(
                playerId,
                StatType.PenaltyGoal,
            )
        }

        if (stat === PlayerStat.RedCards) {
            return await container.playerGameStatisticsRepository.findStatSumForAllSeasons(
                playerId,
                StatType.RedCard,
            )
        }

        if (stat === PlayerStat.YellowCards) {
            return await container.playerGameStatisticsRepository.findStatSumForAllSeasons(
                playerId,
                StatType.YellowCard,
            )
        }

        if (stat === PlayerStat.ScoredGoals) {
            return await container.playerGameStatisticsRepository.findStatSumForAllSeasons(
                playerId,
                StatType.ScoredGoals,
            )
        }

        if (stat === PlayerStat.GoalsPerGameRatio) {
            const playedMatches =
                await container.playerInMatchRepository.findPlayedMatchesCountGroupedBySeasons(
                    playerId,
                )
            const scored = await container.playerGameStatisticsRepository.findStatSumForAllSeasons(
                playerId,
                StatType.ScoredGoals,
            )
            const scoredSeasonMap = scored.reduce((map, pm) => {
                map.set(pm.season, pm)
                return map
            }, new Map())

            const gpgBySeason: StatBySeason[] = []
            for (const pm of playedMatches) {
                const score = scoredSeasonMap.get(pm.season)
                if (!isNil(score)) {
                    gpgBySeason.push({
                        season: pm.season,
                        value: Math.round((score.value / pm.count + Number.EPSILON) * 100) / 100,
                    })
                }
            }
            return gpgBySeason
        }

        return []
    }
}
