import { Competition } from '../../entities/Competition'
import { CompetitionRepository } from '../../repositories/CompetitionRepository'
import { NewCompetitionRequest } from './types'

export class CompetitionService {
    constructor(private readonly competitionRepository: CompetitionRepository) {}

    async saveNewCompetitions(newCompetitions: NewCompetitionRequest[]): Promise<Competition[]> {
        const currentCompetitions = await this.competitionRepository.find()

        const currentCompetitionsMap: Map<string, Competition> = currentCompetitions.reduce(
            (map: Map<string, Competition>, c: Competition) => {
                map.set(`${c.regionId}:${c.facrId}`, c)
                return map
            },
            new Map(),
        )

        const competitionsToInsert = newCompetitions.filter(
            ({ facrId, regionId }) => !currentCompetitionsMap.get(`${regionId}:${facrId}`),
        )

        const competitionsToUpdate = newCompetitions
            .filter(({ facrId, regionId }) => currentCompetitionsMap.get(`${regionId}:${facrId}`))
            .map(({ facrId, facrUuid, name, regionId, regionName }) => {
                return {
                    ...currentCompetitionsMap.get(`${regionId}:${facrId}`),
                    facrUuid,
                    name,
                    regionName,
                }
            })

        console.info(`Competitions: Inserted ${competitionsToInsert.length} new competitions.`)
        console.info(`Competitions: Updated ${competitionsToUpdate.length} existing competitions.`)

        return await this.competitionRepository.save([
            ...competitionsToInsert,
            ...competitionsToUpdate,
        ])
    }
}
