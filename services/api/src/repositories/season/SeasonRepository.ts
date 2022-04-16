import { EntityRepository, Repository } from 'typeorm'
import { Season } from '../../entities/Season'

@EntityRepository(Season)
export class SeasonRepository extends Repository<Season> {
    async findByName(name: Season['name']): Promise<Season | null> {
        const season = await this.findOne({
            where: {
                name,
            },
        })

        return season ?? null
    }
}
