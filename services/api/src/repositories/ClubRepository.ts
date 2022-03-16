import { EntityRepository, Repository } from 'typeorm'
import { Club } from '../entities/Club'

@EntityRepository(Club)
export class ClubRepository extends Repository<Club> {
    async findByFacrId(facrId: Club['facrId']): Promise<Club | null> {
        const club = await this.findOne({
            where: {
                facrId,
            },
        })

        return club ?? null
    }
}
