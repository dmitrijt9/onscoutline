import { EntityRepository, Repository } from 'typeorm'
import { Competition } from '../entities/Competition'

@EntityRepository(Competition)
export class CompetitionRepository extends Repository<Competition> {}
