import { EntityRepository, Repository } from 'typeorm'
import { Player } from '../../entities/Player'

@EntityRepository(Player)
export class PlayerRepository extends Repository<Player> {}
