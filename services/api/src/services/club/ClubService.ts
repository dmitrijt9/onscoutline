import { Club } from '../../entities/Club'
import { ClubRepository } from '../../repositories/club/ClubRepository'
import { NewClubRequest } from './types'

export class ClubService {
    constructor(private readonly clubRepository: ClubRepository) {}

    async processNewClubss(newClubRequest: NewClubRequest[]): Promise<Club[]> {
        const currentClubs = await this.clubRepository.find()
        const currentClubsMap: Map<string, Club> = currentClubs.reduce(
            (map: Map<string, Club>, c: Club) => {
                map.set(c.facrId, c)
                return map
            },
            new Map(),
        )

        const clubsToInsert = newClubRequest.filter(({ facrId }) => !currentClubsMap.get(facrId))

        const clubsToUpdate = newClubRequest
            .filter(({ facrId }) => currentClubsMap.get(facrId))
            .map(({ facrId, facrUuid, name }) => {
                return {
                    ...currentClubsMap.get(facrId),
                    facrUuid,
                    name,
                }
            })

        console.info(`Clubs: Inserted ${clubsToInsert.length} new clubs.`)
        console.info(`Clubs: Updated ${clubsToUpdate.length} existing clubs.`)

        return await this.clubRepository.save([...clubsToInsert, ...clubsToUpdate])
    }
}
