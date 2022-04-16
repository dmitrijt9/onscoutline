import { Season } from '../../entities/Season'
import { ISO8601_NoTime } from '../../entities/types'
import { SeasonRepository } from '../../repositories/season/SeasonRepository'

export class SeasonService {
    constructor(private readonly seasonRepository: SeasonRepository) {}

    async getSeasonByDate(date: ISO8601_NoTime): Promise<Season> {
        const [year, month, _] = date.split('-')
        const yearInt = parseInt(year)
        const monthInt = parseInt(month)

        if (monthInt >= 7 && monthInt <= 12) {
            const year1 = year
            const year2 = `${yearInt + 1}`
            const seasonName = `${year1}/${year2}`
            const season = await this.seasonRepository.findByName(seasonName)

            if (!season) {
                return await this.seasonRepository.save({
                    name: seasonName,
                    year1,
                    year2,
                })
            }

            return season
        }

        const year1 = `${yearInt - 1}`
        const year2 = year
        const seasonName = `${year1}/${year2}`
        const season = await this.seasonRepository.findByName(seasonName)

        if (!season) {
            return await this.seasonRepository.save({
                name: seasonName,
                year1,
                year2,
            })
        }

        return season
    }
}
