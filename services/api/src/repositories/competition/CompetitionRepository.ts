import { EntityRepository, Repository } from 'typeorm'
import { Competition } from '../../entities/Competition'

@EntityRepository(Competition)
export class CompetitionRepository extends Repository<Competition> {
    async findByName(competitionName: Competition['name']): Promise<Competition | null> {
        const competition = await this.findOne({
            where: {
                name: competitionName,
            },
        })

        return competition ?? null
    }
}
