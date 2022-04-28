import { Player } from '../../entities/Player'
import { PlayerInMatch } from '../../entities/Relations/PlayerInMatch'
import { Season } from '../../entities/Season'
import { isNil } from '../../utils/index'
import { EntityRepository, Repository } from 'typeorm'

@EntityRepository(PlayerInMatch)
export class PlayerInMatchRepository extends Repository<PlayerInMatch> {
    async findStartingElevenCount(
        playerId: Player['id'],
        season?: Season['name'],
    ): Promise<number> {
        const qb = this.createQueryBuilder('pim').innerJoin('pim.player', 'p')

        if (!isNil(season)) {
            qb.innerJoin('pim.match', 'm')
                .innerJoin('m.competitionSeason', 'chs')
                .andWhere('chs.season = :season', { season })
        }

        qb.andWhere('p.id = :playerId', { playerId }).andWhere('pim.playedFromMinute = 0')

        return await qb.getCount()
    }

    async findStartingElevenCountGroupedBySeasons(
        playerId: Player['id'],
    ): Promise<{ count: number; season: string }[]> {
        const qb = this.createQueryBuilder('pim')
            .select('COUNT(pim.id) as count')
            .addSelect('chs.seasonName as season')
            .innerJoin('pim.player', 'p')
            .innerJoin('pim.match', 'm')
            .innerJoin('m.competitionSeason', 'chs')
            .andWhere('p.id = :playerId', { playerId })
            .andWhere('pim.playedFromMinute = 0')
            .groupBy('chs.seasonName')
        const result = await qb.getRawMany()

        return result.map((r) => {
            return {
                count: r.count,
                season: r.season,
            }
        })
    }

    async findPlayedMatchesCount(playerId: Player['id'], season?: Season['name']): Promise<number> {
        const qb = this.createQueryBuilder('pim').innerJoin('pim.player', 'p')

        if (!isNil(season)) {
            qb.innerJoin('pim.match', 'm')
                .innerJoin('m.competitionSeason', 'chs')
                .andWhere('chs.season = :season', { season })
        }

        qb.andWhere('p.id = :playerId', { playerId }).andWhere('pim.playedFromMinute is not null')

        return await qb.getCount()
    }

    async findPlayedMatchesCountGroupedBySeasons(
        playerId: Player['id'],
    ): Promise<{ count: number; season: string }[]> {
        const qb = this.createQueryBuilder('pim')
            .select('COUNT(pim.id) as count')
            .addSelect('chs.seasonName as season')
            .innerJoin('pim.player', 'p')
            .innerJoin('pim.match', 'm')
            .innerJoin('m.competitionSeason', 'chs')
            .andWhere('p.id = :playerId', { playerId })
            .andWhere('pim.playedFromMinute is not null')
            .groupBy('chs.seasonName')
        const result = await qb.getRawMany()

        return result.map((r) => {
            return {
                count: r.count,
                season: r.season,
            }
        })
    }
}
