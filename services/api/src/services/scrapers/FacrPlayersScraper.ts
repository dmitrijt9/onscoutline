import { AppConfig } from '../../dependency/config/index'
import { Club } from '../../entities/Club'
import { toOnscoutlineDateFormat } from '../../utils/conversions'
import { isNil } from '../../utils/index'
import { NewPlayerRequest } from '../player/types'
import chunk from '../utils/chunk'
import { AbstractScraper } from './AbstractScraper'
import { FACRScraperElementNotFoundError } from './errors'
import { PuppeteerBrowser } from './PuppeteerBrowser'
import { ScrapedPlayer } from './types'
import { Browser } from 'puppeteer'

export class FacrPlayersScraper extends AbstractScraper {
    private facrMembersUrl: string

    constructor({ facrScraper }: AppConfig, private readonly puppeteerBrowser: PuppeteerBrowser) {
        super()
        this.facrMembersUrl = facrScraper.facrMembersUrl
    }
    /**
     * Scrape players of all clubs using Chrome browser (puppeteer)
     */
    async scrapePlayersOfClubs(clubs: Club[]): Promise<Map<string, NewPlayerRequest[]>> {
        console.time('FACR Scraper Players')
        // I dont want to launch hundreds of browser in parallel...
        // This is why I run this sequentially with for cycle
        const clubsChunks = chunk(clubs, 10)
        const clubToPlayersLinksMap = new Map<
            string,
            { memberInfoPath: string; playerInfoPath: string }[]
        >()
        const scrapedPlayersMap = new Map<string, NewPlayerRequest[]>()

        const browser = await this.puppeteerBrowser.launch()
        for (const clubsChunk of clubsChunks) {
            const results = await Promise.allSettled(
                clubsChunk.map(async (club) => {
                    if (!club.facrId) {
                        // TODO: custom error
                        throw new Error('Cannot scrape players of the club without facrId.')
                    }
                    console.info(
                        `FACR Scraper: Start scrape list of players of a club with id ${club.facrId} using browser.`,
                    )

                    const playersDetailsLinks = await this.scrapePlayerDetailLinks(
                        club.facrId,
                        browser,
                    )

                    clubToPlayersLinksMap.set(club.facrId, playersDetailsLinks)

                    console.info(
                        `FACR Scraper: Finish scrape list of players of a club with id ${club.facrId}.`,
                    )
                }),
            )

            // TODO: retry mechanism
            const rejected = results.filter((r) => r.status === 'rejected')
            rejected.forEach((r) => console.error(r))
        }

        await browser.close()

        let scrapedPlayersLength = 0
        let playersToScrapeLength = 0
        await Promise.all(
            [...clubToPlayersLinksMap.entries()].map(async ([clubFacrId, playerDetailsPaths]) => {
                const playersChunks = chunk(playerDetailsPaths, 10)
                const scrapedPlayers: ScrapedPlayer[] = []
                for (const playersChunk of playersChunks) {
                    const results = await Promise.allSettled(
                        playersChunk.map(async (playerInfoPaths) => {
                            const scraped = await this.scrapePlayerDetails(playerInfoPaths)
                            if (scraped) {
                                scrapedPlayers.push(scraped)
                            }
                        }),
                    )

                    // TODO: retry mechanism
                    const rejected = results.filter((r) => r.status === 'rejected')
                    rejected.forEach((r) => console.error(r))
                }
                playersToScrapeLength += playerDetailsPaths.length
                scrapedPlayersLength += scrapedPlayers.length
                return { club: clubFacrId, scrapedPlayers }
            }),
        )

        console.timeEnd('FACR Scraper Players')
        console.info(
            `FACR Scraper: Successfully scraped ${scrapedPlayersLength}/${playersToScrapeLength} players from all (${clubs.length}) clubs.`,
        )

        return scrapedPlayersMap
    }

    private async scrapePlayerDetails(playerDetailLinks: {
        memberInfoPath: string
        playerInfoPath: string
    }) {
        const memberDetailFullUrl = `${
            this.facrMembersUrl
        }${playerDetailLinks.memberInfoPath.replace('..', '')}`
        const playerDetailFullUrl = `${this.facrMembersUrl}/hraci/${playerDetailLinks.playerInfoPath}`

        try {
            // Start scraping member details
            const memberDetailHtmlPage = await this.getParsedPage(memberDetailFullUrl)
            // await Promise.all([page.waitForNavigation(), page.goto(memberDetailFullUrl)])

            const facrId = memberDetailHtmlPage
                .querySelector('#MainContent_txtIDHrac')
                ?.getAttribute('value')

            if (!facrId) {
                throw new FACRScraperElementNotFoundError(
                    'facrId',
                    'playerDetail',
                    '#MainContent_txtIDHrac',
                )
            }

            const name = memberDetailHtmlPage
                .querySelector('#MainContent_txtName')
                ?.getAttribute('value')

            if (!name) {
                throw new FACRScraperElementNotFoundError(
                    'name',
                    'playerDetail',
                    '#MainContent_txtName',
                )
            }
            const surname = memberDetailHtmlPage
                .querySelector('#MainContent_txtSurname')
                ?.getAttribute('value')

            if (!surname) {
                throw new FACRScraperElementNotFoundError(
                    'surname',
                    'playerDetail',
                    '#MainContent_txtSurname',
                )
            }
            const country = memberDetailHtmlPage
                .querySelector('#MainContent_txtZeme')
                ?.getAttribute('value')

            if (!country) {
                throw new FACRScraperElementNotFoundError(
                    'country',
                    'playerDetail',
                    '#MainContent_txtZeme',
                )
            }

            const gender = memberDetailHtmlPage
                .querySelector('#MainContent_txtPohlavi')
                ?.getAttribute('value')

            if (!gender) {
                throw new FACRScraperElementNotFoundError(
                    'gender',
                    'playerDetail',
                    '#MainContent_txtPohlavi',
                )
            }

            const dateOfBirth = memberDetailHtmlPage
                .querySelector('#MainContent_txtNarozen')
                ?.getAttribute('value')

            if (!dateOfBirth) {
                throw new FACRScraperElementNotFoundError(
                    'dateOfBirth',
                    'playerDetail',
                    '#MainContent_txtNarozen',
                )
            }

            // Start scraping player details
            const playerDetailHtmlPage = await this.getParsedPage(playerDetailFullUrl)
            const passportRows = playerDetailHtmlPage.querySelectorAll(
                '#MainContent_panelBody .list.inside table:not(.vypis-zadosti-hrace) tr:not(:first-child)',
            )

            if (!passportRows) {
                throw new FACRScraperElementNotFoundError(
                    'passportRows',
                    'playerDetail',
                    '#MainContent_panelBody .list.inside table:not(.vypis-zadosti-hrace) tr:not(:first-child)',
                )
            }

            const transfers: ScrapedPlayer['transfers'] = []

            for (const row of passportRows) {
                let from: string | null = null
                let to: string | null = null
                let when: string | null = null
                let event: string | null = null

                const firstCol = await row.querySelector('td:nth-child(1)')?.innerText
                if (isNil(firstCol)) {
                    throw new FACRScraperElementNotFoundError(
                        'firstCol',
                        'playerDetail passport',
                        'td:nth-child(1)',
                        undefined,
                        {
                            url: playerDetailFullUrl,
                        },
                    )
                }

                // its an odd row, with "to" club
                if (!isNil(row.attributes.id)) {
                    const toClub = row.querySelector('td.oddil_do')?.innerText
                    if (isNil(toClub)) {
                        throw new FACRScraperElementNotFoundError(
                            'toClub',
                            'playerDetail passport',
                            'td.oddil_do',
                        )
                    }
                    to = toClub.trim()
                } else {
                    from = firstCol.trim()
                    const whenEvent = row.querySelector('td:nth-child(4)')?.innerText
                    if (isNil(whenEvent)) {
                        throw new FACRScraperElementNotFoundError(
                            'whenEvent',
                            'playerDetail passport',
                            'td:nth-child(1)',
                        )
                    }
                    const eventName = row.querySelector('td.udalost')?.innerText
                    if (isNil(eventName)) {
                        throw new FACRScraperElementNotFoundError(
                            'eventName',
                            'playerDetail passport',
                            'td.udalost',
                        )
                    }

                    when = whenEvent.trim()
                    event = eventName.trim()
                }
                if (from && event && when) {
                    transfers.push({
                        when,
                        event,
                        from,
                        to,
                    })
                }
            }

            return {
                name,
                surname,
                dateOfBirth: ((dateOfBirth) => {
                    const [day, month, year] = dateOfBirth.split('.')
                    return toOnscoutlineDateFormat(new Date(+year, +month, +day))
                })(dateOfBirth),
                facrId,
                transfers: transfers.map((transfer) => {
                    const [day, month, year] = transfer.when.split('.')
                    return {
                        when: toOnscoutlineDateFormat(new Date(+year, +month, +day)),
                        event: transfer.event,
                        from: transfer.from.split(' - ')[1],
                        to: transfer.to ? transfer.to.split(' - ')[1] : null,
                    }
                }),
            }
        } catch (e) {
            console.error(e)
        }
    }

    private async scrapePlayerDetailLinks(
        clubFacrId: Club['facrId'],
        launchedBrowser: Browser,
    ): Promise<{ memberInfoPath: string; playerInfoPath: string }[]> {
        const timeout = 10 * 1000
        const browser = launchedBrowser
        const page = await browser.newPage()
        page.setDefaultTimeout(timeout)
        await page.setViewport({ width: 1705, height: 625 })

        await Promise.all([
            page.waitForNavigation(),
            page.goto(`${this.facrMembersUrl}/hraci/prehled-hracu.aspx`),
        ])

        // find right input for club id
        const numberOfClubInputElement = await this.puppeteerBrowser.waitForSelectors(
            ['#ctl00_MainContent_OddilBoxClenem_txtCisloKlubu'],
            page,
            { timeout, visible: true },
        )

        if (!numberOfClubInputElement) {
            throw new FACRScraperElementNotFoundError(
                'numberOfClubInputElement',
                'players',
                '#ctl00_MainContent_OddilBoxClenem_txtCisloKlubu',
            )
        }

        await this.puppeteerBrowser.scrollIntoViewIfNeeded(numberOfClubInputElement, timeout)

        // write club id to right input field
        await numberOfClubInputElement.focus()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await numberOfClubInputElement.evaluate((el: any, value: string) => {
            el.value = value
            el.dispatchEvent(new Event('input', { bubbles: true }))
            el.dispatchEvent(new Event('change', { bubbles: true }))
        }, clubFacrId)

        // wait for autocomplete box and find a link with suggested club
        const suggestedClubLinkElement = await this.puppeteerBrowser.waitForSelectors(
            ['.ui-autocomplete .ui-menu-item a'],
            page,
            {
                timeout,
                visible: true,
            },
        )
        if (!suggestedClubLinkElement) {
            throw new FACRScraperElementNotFoundError(
                'suggestedClubLinkElement',
                'players',
                '.ui-autocomplete .ui-menu-item a',
            )
        }
        await this.puppeteerBrowser.scrollIntoViewIfNeeded(suggestedClubLinkElement, timeout)
        // click on suggested club
        await Promise.all([page.waitForNavigation(), suggestedClubLinkElement.click()])

        // select only active members
        await page.select('select#listClen', '1')

        // find main button to trigger search
        const searchButtonElement = await this.puppeteerBrowser.waitForSelectors(
            ['#btnSearch'],
            page,
            {
                timeout,
                visible: true,
            },
        )
        if (!searchButtonElement) {
            throw new FACRScraperElementNotFoundError(
                'searchButtonElement',
                'players',
                '#btnSearch',
            )
        }
        await this.puppeteerBrowser.scrollIntoViewIfNeeded(searchButtonElement, timeout)
        // click search button
        await searchButtonElement.click()

        // Start players mining part...
        const idToDetailUrlsMap: { memberInfoPath: string; playerInfoPath: string }[] = []
        // hardcoded - current settings on is.fotbal.cz web
        const itemsPerPage = 50
        // find element with summary of a current pagination
        const paginationSummaryElement = await this.puppeteerBrowser.waitForSelectors(
            ['.pages .sumary'],
            page,
            {
                timeout,
                visible: true,
            },
        )
        if (!paginationSummaryElement) {
            throw new FACRScraperElementNotFoundError(
                'paginationSummaryElement',
                'players',
                '.pages .sumary',
            )
        }
        // Parse string like this 'Zobrazeno 301 - 320 z 328'.
        // I need the last number, which indicates total number if items in database
        const [totalItems] = (await paginationSummaryElement.evaluate((el) => el.innerHTML))
            .split(' ')
            .slice(-1)
        const lastPageNumber = Math.ceil(+totalItems / itemsPerPage)

        // iterate over players pages for current club
        for (let index = 0; index < lastPageNumber; index++) {
            const bodyElement = await this.puppeteerBrowser.waitForSelectors(['body'], page, {
                timeout,
                visible: true,
            })
            if (!bodyElement) {
                throw new FACRScraperElementNotFoundError('bodyElement', 'players', 'body')
            }
            const playerRows = await bodyElement.$$(
                '#MainContent_VypisHracu_gridData tr:not(.first)',
            )

            if (!playerRows) {
                throw new FACRScraperElementNotFoundError(
                    'playerRows',
                    'players',
                    '#MainContent_VypisHracu_gridData tr:not(.first)',
                )
            }

            for (const playerRow of playerRows) {
                const { facrId, playerInfoPath } = await playerRow.$eval('.clenid', (node) => {
                    return {
                        facrId: node.textContent,
                        playerInfoPath: node.getAttribute('href'),
                    }
                })

                if (!facrId) {
                    throw new FACRScraperElementNotFoundError('facrId', 'players', '.clenId')
                }

                if (!playerInfoPath) {
                    throw new FACRScraperElementNotFoundError(
                        'playerInfoPath',
                        'players',
                        '.clenId',
                    )
                }

                const memberInfoPath = await playerRow.$eval('.osobni-udaje', (node) =>
                    node.getAttribute('href'),
                )

                if (!memberInfoPath) {
                    throw new FACRScraperElementNotFoundError(
                        'memberInfoPath',
                        'players',
                        '.osobni-udaje',
                    )
                }
                idToDetailUrlsMap.push({ memberInfoPath, playerInfoPath })
            }
            if (index != lastPageNumber - 1) {
                // no next button on last page
                const nextPageLinkElement = await this.puppeteerBrowser.waitForSelectors(
                    ['.pages .paging li:nth-last-child(2) a'],
                    page,
                    {
                        timeout,
                        visible: true,
                    },
                )
                if (!nextPageLinkElement) {
                    throw new FACRScraperElementNotFoundError(
                        'nextPageLinkElement',
                        'players',
                        '.pages .paging li:nth-last-child(2) a',
                    )
                }
                // navigate to the next page of players table
                await nextPageLinkElement.click()
                await page.waitForNavigation({ timeout })
            }
        }
        if (!page.isClosed()) {
            await page.close()
        }
        return idToDetailUrlsMap
    }
}
