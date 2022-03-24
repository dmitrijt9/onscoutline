import { Container } from '../../dependency/container/index'
import {
    cleanDb,
    createTestingClient,
    stopTestApplication,
    TestingClient,
} from '../../dependency/test-utils/index'
import { toOnscoutlineDateFormat } from '../../utils/conversions'

describe('Player In Club Repository', () => {
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

    it('should save a player in club relation without problems', async () => {
        const { playerRepository, clubRepository, playerInClubRepository } = container

        const savedPlayerInClubRelation = await playerInClubRepository.save({
            club: {
                facrId: '123456',
                facrUuid: 'vfonveiornveoirnv',
                name: 'AC Sparta Praha',
            },
            player: {
                facrId: '123457',
                facrMemberFrom: toOnscoutlineDateFormat(new Date('2005-03-16')),
                name: 'Kristian',
                surname: 'Ronaldny',
                yearOfBirth: '1990',
            },
            playingFrom: toOnscoutlineDateFormat(new Date('2005-06-01')),
        })

        const savedPlayer = await playerRepository.findOne({
            facrId: '123457',
        })

        const savedClub = await clubRepository.findOne({
            facrId: '123456',
        })

        expect(savedPlayerInClubRelation).not.toBeNull()
        expect(savedPlayerInClubRelation.club).toEqual(savedClub)
        expect(savedPlayerInClubRelation.player).toEqual(savedPlayer)
        expect(savedPlayerInClubRelation.playingFrom).toBe('2005-06-01')
        expect(savedPlayerInClubRelation.isOnLoan).toBe(false)
    })
})
