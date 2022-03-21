import { EntityRepository, Repository } from 'typeorm'
import { PlayerGameStatistic } from '../../entities/PlayerGameStatistic'

@EntityRepository(PlayerGameStatistic)
export class PlayerGameStatisticRepository extends Repository<PlayerGameStatistic> {}
