import { Container } from '../../dependency/container/index'
import {
    cleanDb,
    createTestingClient,
    stopTestApplication,
    TestingClient,
} from '../../dependency/test-utils/index'

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
                name: '2020/2021',
                year1: '2020',
                year2: '2022',
            },
            {
                name: '2021/2022',
                year1: '2021',
                year2: '2022',
            },
        ])

        expect(savedSeasons.length).toBe(2)
        expect(savedSeasons).toMatchSnapshot()
    })
})
