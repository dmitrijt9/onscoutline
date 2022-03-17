import { EntityRepository, Repository } from 'typeorm'
import { Match } from '../../entities/Match'

@EntityRepository(Match)
export class MatchRepository extends Repository<Match> {}
