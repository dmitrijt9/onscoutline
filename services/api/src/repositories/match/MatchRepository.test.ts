import { Container } from '../../dependency/container/index'
import {
    cleanDb,
    createTestingClient,
    stopTestApplication,
    TestingClient,
} from '../../dependency/test-utils/index'
import { SeasonType } from '../../entities/Season'

describe('Match Repository', () => {
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

    it('should save a match without problems', async () => {
        const {
            matchRepository,
            clubRepository,
            competitionHasSeasonRepository,
            competitionRepository,
            seasonRepository,
        } = container

        const randomCompetition = await competitionRepository.save({
            facrId: '12345',
            facrUuid: 'djoiwejdow',
            name: 'Fortuna liga',
            regionId: '2A3',
            regionName: 'CR',
        })

        const randomSeason = await seasonRepository.save({
            name: 'jaro2020',
            type: SeasonType.Spring,
            year: '2020',
        })

        const randomCompetitionSeason = await competitionHasSeasonRepository.save({
            competition: randomCompetition,
            season: randomSeason,
        })

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

        const savedMatch = await matchRepository.save({
            homeTeam: randomClub1,
            awayTeam: randomClub2,
            scoreHome: 2,
            scoreAway: 2,
            when: new Date('2022-03-16').toUTCString(),
            where: 'Some place',
            competition: randomCompetitionSeason,
        })

        expect(savedMatch).not.toBeNull()
        expect(savedMatch.homeTeam).toBe(randomClub1)
        expect(savedMatch.awayTeam).toBe(randomClub2)
        expect(new Date(savedMatch.when).toUTCString()).toBe(new Date('2022-03-16').toUTCString())
    })
})
