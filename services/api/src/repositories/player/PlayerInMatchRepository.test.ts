import { Container } from '../../dependency/container/index'
import {
    cleanDb,
    createTestingClient,
    stopTestApplication,
    TestingClient,
} from '../../dependency/test-utils/index'
import { toOnscoutlineDateFormat } from '../../utils/conversions'

describe('Player In Match Repository', () => {
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

    it('should save a player in match relation without problems', async () => {
        const { playerInMatchRepository, playerRepository, matchRepository, clubRepository } =
            container

        // Save random clubs for match
        const randomClub1 = await clubRepository.save({
            facrId: '123456',
            facrUuid: 'vfonveiornveoirnv',
            name: 'AC Sparta Praha',
        })

        const randomClub2 = await clubRepository.save({
            facrId: '123457',
            facrUuid: 'vfonveiornveoirng',
            name: 'SK Slavia Praha',
        })

        // save random match
        const randomMatch = await matchRepository.save({
            homeTeam: randomClub1,
            awayTeam: randomClub2,
            scoreHome: 2,
            scoreAway: 2,
            when: new Date('2022-03-16').toUTCString(),
            where: 'Some place',
        })

        // save ranom player
        const randomPlayer = await playerRepository.save({
            facrId: '123457',
            facrMemberFrom: toOnscoutlineDateFormat(new Date('2005-03-16')),
            name: 'Kristian',
            surname: 'Ronaldny',
            yearOfBirth: '1990',
        })

        const savedPlayerInMatchRelation = await playerInMatchRepository.save({
            match: randomMatch,
            player: randomPlayer,
            playedFromMinute: 0, // player plays from first minute (in starting lineup)
        })

        expect(savedPlayerInMatchRelation).not.toBeNull()
        expect(savedPlayerInMatchRelation.match).toBe(randomMatch)
        expect(savedPlayerInMatchRelation.player).toBe(randomPlayer)
    })
})
