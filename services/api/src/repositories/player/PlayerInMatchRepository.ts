import { EntityRepository, Repository } from 'typeorm'
import { PlayerInMatch } from '../../entities/Relations/PlayerInMatch'

@EntityRepository(PlayerInMatch)
export class PlayerInMatchRepository extends Repository<PlayerInMatch> {}
