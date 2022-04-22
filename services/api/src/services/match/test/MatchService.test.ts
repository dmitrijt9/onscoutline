import { Container } from '../../../dependency/container/index'
import {
    cleanDb,
    createTestingClient,
    stopTestApplication,
    TestingClient,
} from '../../../dependency/test-utils/index'
import { MatchClubNotFound } from '../errors'
import { createMatchesValidMock } from './mocks/create-matches-mocks'

describe('Match service', () => {
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

    describe('Create Match', () => {
        // TODO: More granular tests - separate each steps of creation of a match
        it('should reject a new match request due to missing Club in DB', async () => {
            const { matchService, competitionRepository } = container

            await competitionRepository.save({
                name: createMatchesValidMock[0].competition,
                facrId: 'G1A',
                regionId: '0f0e832e-7320-419f-972a-23bac9e4b657',
                facrUuid: 'huiheude',
                regionName: 'FAČR Ženy',
            })
            const results = await matchService.createMatches(createMatchesValidMock)

            expect(results[0].status).toBe('rejected')
            if (results[0].status === 'rejected') {
                expect(results[0].reason).toBeInstanceOf(MatchClubNotFound)
            }
        })
    })
})
