import { Container } from '../../dependency/container/index'
import {
    cleanDb,
    createTestingClient,
    stopTestApplication,
    TestingClient,
} from '../../dependency/test-utils/index'
import { toOnscoutlineDateFormat } from '../../utils/conversions'

describe('Player Repository', () => {
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

    it('should save a player without problems', async () => {
        const { playerRepository } = container

        const savedPlayer = await playerRepository.save({
            facrId: '123457',
            facrMemberFrom: toOnscoutlineDateFormat(new Date('2005-03-16')),
            name: 'Kristian',
            surname: 'Ronaldny',
            yearOfBirth: '1990',
        })

        expect(savedPlayer).not.toBeNull()
        const { id, ...savedPlayerWithoutId } = savedPlayer
        expect(savedPlayerWithoutId).toMatchSnapshot()
    })
})
