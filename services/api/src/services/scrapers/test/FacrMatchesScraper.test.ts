import { readFileSync } from 'fs'
import parse from 'node-html-parser'
import {
    cleanDb,
    createTestingClient,
    stopTestApplication,
    TestingClient,
} from '../../../dependency/test-utils/index'
import { FacrMatchesScraper } from '../FacrMatchesScraper'

describe('Facr Matches Scraper', () => {
    let testingClient: TestingClient
    let facrScraper: FacrMatchesScraper

    beforeAll(async () => {
        testingClient = await createTestingClient()
        facrScraper = testingClient.container.facrMatchesScraper
    })

    afterAll(async () => {
        await stopTestApplication(testingClient.application)
    })

    beforeEach(async () => {
        await cleanDb(testingClient)
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
            .spyOn(FacrMatchesScraper.prototype, 'getParsedPage')
            .mockImplementation(async (url: string) => {
                console.log(url)
                return parse(matchDetailHtmlString)
            })

        const scrapedMatch = (await facrScraper.scrapeMatches([matchesTableHtmlString]))[0]

        expect(getParsedPageMock).toHaveBeenCalled()
        expect(scrapedMatch).toMatchSnapshot()
    })
})
