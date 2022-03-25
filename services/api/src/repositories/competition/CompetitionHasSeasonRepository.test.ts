import { QueryFailedError } from 'typeorm'
import { Container } from '../../dependency/container/index'
import {
    cleanDb,
    createTestingClient,
    stopTestApplication,
    TestingClient,
} from '../../dependency/test-utils/index'

describe('Competition Has Season Repository', () => {
    let testingClient: TestingClient
    let container: Container

    beforeAll(async () => {
        testingClient = await createTestingClient()
        container = testingClient.container
    })

    afterAll(async () => {
        await stopTestApplication(testingClient.application)
    })

    beforeEach(async () => {
        await cleanDb(testingClient)
    })

    it('should save a competition has a season relation without problems', async () => {
        const { seasonRepository, competitionRepository, competitionHasSeasonRepository } =
            container

        const randomSeason = await seasonRepository.save({
            name: '2019/2020',
            year1: '2021',
            year2: '2020',
        })

        const randomCompetition = await competitionRepository.save({
            facrId: '12434',
            facrUuid: 'coienhieo',
            name: '!.liga',
            regionId: '2A2',
            regionName: 'Celostatni souteze',
        })

        const savedRelation = await competitionHasSeasonRepository.save({
            competition: randomCompetition,
            season: randomSeason,
        })

        expect(savedRelation).not.toBeNull()
        expect(savedRelation.competition).toBe(randomCompetition)
        expect(savedRelation.season).toBe(randomSeason)
    })

    it('should throw a duplication error when trying to save to same competition-season pairs', async () => {
        const { seasonRepository, competitionRepository, competitionHasSeasonRepository } =
            container

        const randomSeason = await seasonRepository.save({
            name: '2019/2020',
            year1: '2021',
            year2: '2020',
        })

        const randomCompetition = await competitionRepository.save({
            facrId: '12434',
            facrUuid: 'coienhieo',
            name: '!.liga',
            regionId: '2A2',
            regionName: 'Celostatni souteze',
        })

        const savedRelation = await competitionHasSeasonRepository.save({
            competition: randomCompetition,
            season: randomSeason,
        })

        expect(savedRelation).not.toBeNull()

        try {
            await competitionHasSeasonRepository.save({
                competition: randomCompetition,
                season: randomSeason,
            })
        } catch (e) {
            expect(e).toBeInstanceOf(QueryFailedError)
            expect(e.errno).toBe(1062)
        }
    })
})
