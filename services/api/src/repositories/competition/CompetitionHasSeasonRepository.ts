import { EntityRepository, Repository } from 'typeorm'
import { CompetitionHasSeason } from '../../entities/Relations/CompetitionHasSeason'

@EntityRepository(CompetitionHasSeason)
export class CompetitionHasSeasonRepository extends Repository<CompetitionHasSeason> {}
