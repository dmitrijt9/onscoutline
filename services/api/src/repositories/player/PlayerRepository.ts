import { EntityRepository, Repository } from 'typeorm'
import { Player } from '../../entities/Player'

@EntityRepository(Player)
export class PlayerRepository extends Repository<Player> {
    /**
     * Finds a player by his fullname
     * @param fullname Fullname of the player in a format - Surname + Name
     * @returns
     */
    async findByFullname(fullname: string): Promise<Player | null> {
        const player = await this.createQueryBuilder('player')
            .where("CONCAT(player.surname, ' ', player.name) LIKE :fullname", {
                fullname: `%${fullname}%`,
            })
            .getOne()

        return player ?? null
    }

    async findAllByFullname(fullnames: string[]): Promise<Player[]> {
        return this.createQueryBuilder('player')
            .where("CONCAT(player.surname, ' ', player.name) IN (:fullnames)", {
                fullnames,
            })
            .getMany()
    }
}
