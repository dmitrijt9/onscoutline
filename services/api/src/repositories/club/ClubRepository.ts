import { Club } from '../../entities/Club'
import { EntityRepository, Repository } from 'typeorm'

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

    async findByName(name: Club['name']): Promise<Club | null> {
        const club = await this.findOne({
            where: {
                name,
            },
        })

        return club ?? null
    }
}
