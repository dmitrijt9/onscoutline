import { Club } from '../../entities/Club'
import { Player } from '../../entities/Player'
import { PlayerInClub } from '../../entities/Relations/PlayerInClub'
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
}
