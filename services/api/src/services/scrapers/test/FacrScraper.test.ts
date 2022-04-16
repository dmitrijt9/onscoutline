import { readFileSync } from 'fs'
import parse from 'node-html-parser'
import {
    cleanDb,
    createTestingClient,
    stopTestApplication,
    TestingClient,
} from '../../../dependency/test-utils/index'
import { FacrScraper } from '../FacrScraper'
import { IFacrScraper } from '../types'

jest.setTimeout(100 * 1000)

describe('FacrScraper', () => {
    let testingClient: TestingClient
    let facrScraper: IFacrScraper

    beforeAll(async () => {
        testingClient = await createTestingClient()
        facrScraper = testingClient.container.facrScraper
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
            .spyOn(FacrScraper.prototype, 'getParsedPage')
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

    it('should scrape matches from html correctly', async () => {
        const matchDetailHtmlString = readFileSync(__dirname + '/mocks/facr-match-test.html', {
            encoding: 'utf8',
            flag: 'r',
        })

        const matchesTableHtmlString = readFileSync(__dirname + '/mocks/facr-matches-test.html', {
            encoding: 'utf8',
            flag: 'r',
        })

        const getParsedPageMock = jest
            .spyOn(FacrScraper.prototype, 'getParsedPage')
            .mockImplementation(async (url: string) => {
                console.log(url)
                return parse(matchDetailHtmlString)
            })

        const scrapedMatch = (await facrScraper.scrapeMatches([matchesTableHtmlString]))[0]

        expect(getParsedPageMock).toHaveBeenCalled()
        expect(scrapedMatch).toMatchSnapshot()
    })
})
