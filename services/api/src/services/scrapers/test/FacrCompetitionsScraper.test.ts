import { readFileSync } from 'fs'
import parse from 'node-html-parser'
import {
    cleanDb,
    createTestingClient,
    stopTestApplication,
    TestingClient,
} from '../../../dependency/test-utils/index'
import { FacrCompetitionsScraper } from '../FacrCompetitionsScraper'

describe('FacrScraper', () => {
    let testingClient: TestingClient
    let facrScraper: FacrCompetitionsScraper

    beforeAll(async () => {
        testingClient = await createTestingClient()
        facrScraper = testingClient.container.facrCompetitionsScraper
    })

    afterAll(async () => {
        await stopTestApplication(testingClient.application)
    })

    beforeEach(async () => {
        await cleanDb(testingClient)
    })

    it('should scrape and save competitions', async () => {
        const regionsTestHtmlString = readFileSync(__dirname + '/mocks/facr-regions-test.html', {
            encoding: 'utf8',
            flag: 'r',
        })

        const mainCompetitionsTestHtmlString = readFileSync(
            __dirname + '/mocks/facr-main-competitions-test.html',
            {
                encoding: 'utf8',
                flag: 'r',
            },
        )
        const getParsedPageMock = jest
            .spyOn(FacrCompetitionsScraper.prototype, 'getParsedPage')
            .mockImplementation(async (url: string) => {
                if (url.endsWith('/subjekty')) {
                    return parse(regionsTestHtmlString)
                }

                return parse(mainCompetitionsTestHtmlString)
            })

        const scrapedCompetitions = await facrScraper.scrapeCompetitions()
        const savedCompetitions =
            await testingClient.container.competitionService.saveNewCompetitions(
                scrapedCompetitions,
            )

        expect(getParsedPageMock).toHaveBeenCalled()
        expect(savedCompetitions).not.toBeUndefined()
        expect(savedCompetitions?.length).toBe(2)
    })
})
