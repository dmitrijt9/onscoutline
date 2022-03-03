import { EntityRepository, Repository } from 'typeorm'
import { Club } from '../entities/Club'

@EntityRepository(Club)
export class ClubRepository extends Repository<Club> {}
