import { Container } from '../../../dependency/container/index'
import {
    cleanDb,
    createTestingClient,
    stopTestApplication,
    TestingClient,
} from '../../../dependency/test-utils/index'
import { MatchClubNotFound, MatchPlayerNotFound } from '../errors'
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

        it('should reject a new match request due to missing Player in DB', async () => {
            const { matchService, competitionRepository, clubRepository } = container

            await clubRepository.save({
                facrId: '4260531',
                facrUuid: 'some',
                name: 'FK Teplice - fotbal, spolek',
            })

            await clubRepository.save({
                facrId: '3230351',
                facrUuid: 'some',
                name: 'VIKTORIA PLZEŇ - fotbal, z.s.',
            })

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
                expect(results[0].reason).toBeInstanceOf(MatchPlayerNotFound)
            }
        })
    })
})
