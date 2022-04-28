import { Club } from '../../entities/Club'
import { Player } from '../../entities/Player'
import { PlayerInClub } from '../../entities/Relations/PlayerInClub'
import { ISO8601_NoTime } from '../../entities/types'
import { EntityRepository, Repository } from 'typeorm'

@EntityRepository(PlayerInClub)
export class PlayerInClubRepository extends Repository<PlayerInClub> {
    async findLastByPlayerAndClub(player: Player, club: Club): Promise<PlayerInClub | null> {
        const playerInClub = await this.findOne({
            where: {
                player,
                club,
            },
            order: {
                playingFrom: 'DESC',
            },
        })

        return playerInClub ?? null
    }

    async findAllByPlayerFullnameAndClub(
        fullnames: string[],
        club: Club,
        matchTime: ISO8601_NoTime,
    ): Promise<PlayerInClub[]> {
        return await this.createQueryBuilder('pIc')
            .leftJoinAndSelect('pIc.player', 'p')
            .leftJoin('pIc.club', 'c')
            .where("CONCAT(p.surname, ' ', p.name) IN (:fullnames)", {
                fullnames,
            })
            .andWhere('c.id = :clubId', {
                clubId: club.id,
            })
            .andWhere(':matchTime >= pIc.playingFrom', {
                matchTime,
            })
            .getMany()
    }
}
