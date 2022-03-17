import { EntityRepository, Repository } from 'typeorm'
import { Season } from '../../entities/Season'

@EntityRepository(Season)
export class SeasonRepository extends Repository<Season> {}
