import { Player } from '../../entities/Player'
import { PlayerGameStatistic, StatType } from '../../entities/PlayerGameStatistic'
import { Season } from '../../entities/Season'
import { isNil } from '../../utils/index'
import { EntityRepository, Repository } from 'typeorm'

@EntityRepository(PlayerGameStatistic)
export class PlayerGameStatisticRepository extends Repository<PlayerGameStatistic> {
    async findCleanSheetsCount(playerId: Player['id'], season?: Season['name']): Promise<number> {
        const qb = this.createQueryBuilder('pgs')
            .innerJoin('pgs.playerInMatch', 'pim')
            .innerJoin('pim.player', 'p')

        if (!isNil(season)) {
            qb.innerJoin('pim.match', 'm')
                .innerJoin('m.competitionSeason', 'chs')
                .andWhere('chs.season = :season', { season })
        }

        qb.andWhere('p.id = :playerId', { playerId })
            .andWhere(`pgs.statType = '${StatType.ConcededGoals}'`)
            .andWhere('pgs.value = 0')

        return qb.getCount()
    }

    async findCleanSheetsCountGroupedBySeason(
        playerId: Player['id'],
    ): Promise<{ count: number; season: string }[]> {
        const qb = this.createQueryBuilder('pgs')
            .select('COUNT(pgs.id) as count')
            .addSelect('chs.seasonName as season')
            .innerJoin('pgs.playerInMatch', 'pim')
            .innerJoin('pim.player', 'p')
            .innerJoin('pim.match', 'm')
            .innerJoin('m.competitionSeason', 'chs')
            .andWhere('p.id = :playerId', { playerId })
            .andWhere(`pgs.statType = '${StatType.ConcededGoals}'`)
            .andWhere('pgs.value = 0')

        const result = await qb.getRawMany()
        console.log(result)

        return result
            .filter((r) => r.season !== null)
            .map((r) => {
                return {
                    count: r.count,
                    season: r.season,
                }
            })
    }

    async findAllStatTypesSum(
        playerId: Player['id'],
        season?: Season['name'],
    ): Promise<AllStatTypesSums> {
        const qb = this.createQueryBuilder('pgs')
            .select('sum(pgs.value) as sum')
            .addSelect('pgs.statType as statType')
            .innerJoin('pgs.playerInMatch', 'pim')
            .innerJoin('pim.player', 'p')

        if (!isNil(season)) {
            qb.innerJoin('pim.match', 'm')
                .innerJoin('m.competitionSeason', 'chs')
                .andWhere('chs.season = :season', { season })
        }

        qb.andWhere('p.id = :playerId', { playerId }).groupBy('pgs.statType')

        const result = await qb.getRawMany()
        return result.reduce(
            (resObj, resSql) => {
                if (resSql.statType === StatType.YellowCard) {
                    resObj.yellowCards += +resSql.sum
                }

                if (resSql.statType === StatType.RedCard) {
                    resObj.redCards += +resSql.sum
                }

                if (resSql.statType === StatType.ConcededGoals) {
                    resObj.concededGoals += +resSql.sum
                }

                if (resSql.statType === StatType.RegularGoal) {
                    resObj.regularGoals += +resSql.sum
                }

                if (resSql.statType === StatType.PenaltyGoal) {
                    resObj.penaltyGoals += +resSql.sum
                }

                if (resSql.statType === StatType.OwnGoal) {
                    resObj.ownGoals += +resSql.sum
                }

                if (resSql.statType === StatType.Hattrick) {
                    resObj.hattricks += +resSql.sum
                }

                return resObj
            },
            {
                yellowCards: 0,
                redCards: 0,
                concededGoals: 0,
                regularGoals: 0,
                penaltyGoals: 0,
                ownGoals: 0,
                hattricks: 0,
            },
        )
    }

    async findStatSumForAllSeasons(
        playerId: Player['id'],
        statType: StatType,
    ): Promise<{ season: string; value: number }[]> {
        const qb = this.createQueryBuilder('pgs')
            .select('sum(pgs.value) as sum')
            .addSelect('chs.season as season')
            .innerJoin('pgs.playerInMatch', 'pim')
            .innerJoin('pim.player', 'p')
            .innerJoin('pim.match', 'm')
            .innerJoin('m.competitionSeason', 'chs')
            .where('p.id = :playerId', { playerId })
            .andWhere('pgs.value > 0')

        if (statType === StatType.ScoredGoals) {
            qb.andWhere(`pgs.statType IN ('${StatType.RegularGoal}', '${StatType.PenaltyGoal}')`)
        } else {
            qb.andWhere('pgs.statType = :statType', { statType })
        }
        qb.groupBy('chs.season')

        const result = await qb.getRawMany()

        return result.map((r) => {
            return {
                season: r.season,
                value: r.sum,
            }
        })
    }
}

type AllStatTypesSums = {
    yellowCards: number
    redCards: number
    concededGoals: number
    regularGoals: number
    penaltyGoals: number
    ownGoals: number
    hattricks: number
}
