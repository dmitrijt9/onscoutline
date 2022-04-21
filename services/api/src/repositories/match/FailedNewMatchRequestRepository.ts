import { FailedNewMatchRequest } from '../../entities/FailedNewMatchRequest'
import { EntityRepository, Repository } from 'typeorm'

@EntityRepository(FailedNewMatchRequest)
export class FailedNewMatchRequestRepository extends Repository<FailedNewMatchRequest> {}
