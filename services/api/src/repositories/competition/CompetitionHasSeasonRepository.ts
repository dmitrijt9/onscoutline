import { EntityRepository, Repository } from 'typeorm'
import { Competition } from '../../entities/Competition'
import { CompetitionHasSeason } from '../../entities/Relations/CompetitionHasSeason'
import { Season } from '../../entities/Season'

@EntityRepository(CompetitionHasSeason)
export class CompetitionHasSeasonRepository extends Repository<CompetitionHasSeason> {
    async findByCompetitionAndSeason(
        competition: Competition,
        season: Season,
    ): Promise<CompetitionHasSeason | null> {
        const competitionHasSeason = await this.findOne({
            where: {
                competition,
                season,
            },
        })

        return competitionHasSeason ?? null
    }
}
