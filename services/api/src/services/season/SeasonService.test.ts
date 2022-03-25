import { Container } from '../../dependency/container/index'
import {
    cleanDb,
    createTestingClient,
    stopTestApplication,
    TestingClient,
} from '../../dependency/test-utils/index'

describe('Season Service', () => {
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

    it('should save correct season to DB when particular date provided', async () => {
        const { seasonService } = container

        const matchDate1 = '2019-07-23'
        const matchDate2 = '2019-12-23'
        const matchDate3 = '2020-04-23'

        const returnedSeason1 = await seasonService.getSeasonByDate(matchDate1)
        const returnedSeason2 = await seasonService.getSeasonByDate(matchDate2)
        const returnedSeason3 = await seasonService.getSeasonByDate(matchDate3)

        expect(returnedSeason1).toEqual({
            name: '2019/2020',
            year1: '2019',
            year2: '2020',
        })
        expect(returnedSeason2).toEqual({
            name: '2019/2020',
            year1: '2019',
            year2: '2020',
        })

        expect(returnedSeason3).toEqual({
            name: '2019/2020',
            year1: '2019',
            year2: '2020',
        })
    })

    it('should return existing season and not saving same season twice', async () => {
        const { seasonService, seasonRepository } = container
        const matchDate1 = '2019-07-23'
        const matchDate2 = '2019-12-23'

        const returnedSeason1 = await seasonService.getSeasonByDate(matchDate1)
        const returnedSeason2 = await seasonService.getSeasonByDate(matchDate2)

        const allSeasons = await seasonRepository.find()

        expect(allSeasons.length).toBe(1)
        expect(allSeasons[0]).toEqual(returnedSeason1)
        expect(allSeasons[0]).toEqual(returnedSeason2)
    })
})
