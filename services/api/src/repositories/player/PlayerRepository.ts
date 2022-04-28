import { Player } from '../../entities/Player'
import { EntityRepository, Repository } from 'typeorm'

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

    async findByQuery(query: string): Promise<Player[]> {
        return await this.createQueryBuilder('player')
            .where(
                `player.name LIKE :query OR 
                player.surname LIKE :query OR 
                CONCAT(player.name, " ", player.surname) LIKE :query OR 
                CONCAT(player.surname, " ", player.name) LIKE :query
                `,
                {
                    query: `%${query}%`,
                },
            )
            .getMany()
    }
}
