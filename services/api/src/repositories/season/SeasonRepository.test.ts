import { Container } from '../../dependency/container/index'
import {
    cleanDb,
    createTestingClient,
    stopTestApplication,
    TestingClient,
} from '../../dependency/test-utils/index'
import { SeasonType } from '../../entities/Season'

describe('Season Repository', () => {
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

    it('should save a multiple seasons without problems', async () => {
        const { seasonRepository } = container

        const savedSeasons = await seasonRepository.save([
            {
                name: 'jaro2020',
                type: SeasonType.Spring,
                year: '2020',
            },
            {
                name: 'podzim2020',
                type: SeasonType.Autumn,
                year: '2020',
            },
            {
                name: 'jaro2021',
                type: SeasonType.Spring,
                year: '2021',
            },
            {
                name: 'podzim2021',
                type: SeasonType.Autumn,
                year: '2021',
            },
        ])

        expect(savedSeasons.length).toBe(4)
        expect(savedSeasons).toMatchSnapshot()
    })
})
