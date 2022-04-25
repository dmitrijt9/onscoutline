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

                return resObj
            },
            {
                yellowCards: 0,
                redCards: 0,
                concededGoals: 0,
                regularGoals: 0,
                penaltyGoals: 0,
                ownGoals: 0,
            },
        )
    }
}

type AllStatTypesSums = {
    yellowCards: number
    redCards: number
    concededGoals: number
    regularGoals: number
    penaltyGoals: number
    ownGoals: number
}
