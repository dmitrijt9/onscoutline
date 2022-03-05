import { EntityRepository, Repository } from 'typeorm'
import { PlayerInClub } from '../entities/Relations/PlayerInClub'

@EntityRepository(PlayerInClub)
export class PlayerInClubRepository extends Repository<PlayerInClub> {}
