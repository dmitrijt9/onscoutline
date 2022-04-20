import { Container } from '../../dependency/container/index'
import {
    cleanDb,
    createTestingClient,
    stopTestApplication,
    TestingClient,
} from '../../dependency/test-utils/index'
import { Gender } from '../../entities/Player'
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
            gender: Gender.Male,
            country: 'Portugalsko',
            dateOfBirth: toOnscoutlineDateFormat(new Date('1990-03-16')),
        })

        expect(savedPlayer).not.toBeNull()
        const { id, ...savedPlayerWithoutId } = savedPlayer
        expect(savedPlayerWithoutId).toMatchSnapshot()
    })

    it('should find a player by his fullname', async () => {
        const { playerRepository } = container

        const savedPlayer1 = await playerRepository.save({
            facrId: 'prvni',
            facrMemberFrom: toOnscoutlineDateFormat(new Date('2005-03-16')),
            name: 'Kristian',
            surname: 'Ronaldny',
            gender: Gender.Male,
            country: 'Portugalsko',
            dateOfBirth: toOnscoutlineDateFormat(new Date('1990-03-16')),
        })

        const savedPlayer2 = await playerRepository.save({
            facrId: 'druhej',
            facrMemberFrom: toOnscoutlineDateFormat(new Date('2005-03-16')),
            name: 'Javier Alando',
            surname: 'Martinez Suarez',
            gender: Gender.Male,
            country: 'Portugalsko',
            dateOfBirth: toOnscoutlineDateFormat(new Date('1990-03-16')),
        })

        const foundPlayer1 = await playerRepository.findByFullname('Ronaldny Kristian')
        const foundPlayer2 = await playerRepository.findByFullname('Martinez Suarez Javier Alando')

        expect(foundPlayer1).not.toBeNull()
        expect(foundPlayer2).not.toBeNull()

        expect(foundPlayer1).toEqual(savedPlayer1)
        expect(foundPlayer2).toEqual(savedPlayer2)
    })
})
