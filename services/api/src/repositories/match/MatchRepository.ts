import { Match } from '../../entities/Match'
import { EntityRepository, Repository } from 'typeorm'

@EntityRepository(Match)
export class MatchRepository extends Repository<Match> {}
