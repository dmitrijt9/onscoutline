import { AppConfig } from '../../dependency/config/index'
import { Club } from '../../entities/Club'
import { fromFacrDate } from '../../utils/conversions'
import { isNil, sleep } from '../../utils/index'
import chunk from '../utils/chunk'
import { Gender } from '../../entities/Player'
import { AbstractScraper } from './AbstractScraper'
import { FACRScraperElementNotFoundError } from './errors'
import { PuppeteerBrowser } from './PuppeteerBrowser'
import { ClubPlayersLinks, ClubScrapedPlayers, PlayerLinks, ScrapedPlayer } from './types'
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
    async scrapePlayersOfClubs(clubs: Club[]): Promise<ClubScrapedPlayers[]> {
        console.time('FACR Scraper Players')
        console.info(
            `FACR Players Scraper: Start to scrape lists of players from clubs (${clubs.length})`,
        )
        // I dont want to launch hundreds of browser in parallel...
        // This is why I run this sequentially with for cycle
        const clubsChunks = chunk(clubs, 5)
        const clubPlayersLinks: ClubPlayersLinks[] = []

        const browser = await this.puppeteerBrowser.launch()
        for (const clubsChunk of clubsChunks) {
            await sleep(100)
            const results = await Promise.allSettled(
                clubsChunk.map(async (club) => {
                    if (!club.facrId) {
                        // TODO: custom error
                        throw new Error('Cannot scrape players of the club without facrId.')
                    }

                    const playersDetailsLinks = await this.scrapePlayerDetailLinks(
                        club.facrId,
                        browser,
                    )

                    clubPlayersLinks.push({
                        club: club.facrId,
                        playersLinks: playersDetailsLinks,
                    })
                }),
            )

            // TODO: retry mechanism
            const rejected = results.filter((r) => r.status === 'rejected')
            rejected.forEach((r) => console.error(r))
        }

        await browser.close()
        console.info(
            `FACR Players Scraper: Finish to scrape lists of players from clubs. Scraped ${clubPlayersLinks.length} clubs.`,
        )

        console.info('FACR Scraper Players: Start to scrape players details.')
        let scrapedPlayersLength = 0
        let playersToScrapeLength = 0
        const clubsScrapedPlayers: ClubScrapedPlayers[] = []
        for (const { club, playersLinks } of clubPlayersLinks) {
            const scrapedPlayers: ScrapedPlayer[] = []

            for (const playerInfoPaths of playersLinks) {
                await sleep(200)
                try {
                    const scraped = await this.scrapePlayerDetails(playerInfoPaths)
                    if (scraped) {
                        scrapedPlayers.push(scraped)
                    }
                } catch (e) {
                    // TODO: save to db failed scrape record, to make retry mechanism (similat to failed match request)
                    console.log('to retry', {
                        club,
                        ...playerInfoPaths,
                    })
                }
            }
            playersToScrapeLength += playersLinks.length
            scrapedPlayersLength += scrapedPlayers.length
            clubsScrapedPlayers.push({ club, scrapedPlayers })
        }

        console.timeEnd('FACR Scraper Players')
        console.info(
            `FACR Scraper: Successfully scraped ${scrapedPlayersLength}/${playersToScrapeLength} players from all (${clubs.length}) clubs.`,
        )

        return clubsScrapedPlayers
    }

    private async scrapePlayerDetails(playerDetailLinks: {
        memberInfoPath: string
        playerInfoPath: string
    }): Promise<ScrapedPlayer> {
        const memberDetailFullUrl = `${
            this.facrMembersUrl
        }${playerDetailLinks.memberInfoPath.replace('..', '')}`
        const playerDetailFullUrl = `${this.facrMembersUrl}/hraci/${playerDetailLinks.playerInfoPath}`
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
                undefined,
                {
                    memberDetailFullUrl,
                },
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
                undefined,
                {
                    memberDetailFullUrl,
                },
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
        const facrMemberFrom = playerDetailHtmlPage
            .querySelector('#MainContent_txtRegOd')
            ?.getAttribute('value')

        if (!facrMemberFrom) {
            throw new FACRScraperElementNotFoundError(
                'facrMemberFrom',
                'playerDetail',
                '#MainContent_txtRegOd',
            )
        }

        const parentClubId = playerDetailHtmlPage
            .querySelector('#MainContent_txtOddilId')
            ?.getAttribute('value')

        if (!parentClubId) {
            throw new FACRScraperElementNotFoundError(
                'parentClubId',
                'playerDetail',
                '#MainContent_txtOddilId',
            )
        }

        const parentClubName = playerDetailHtmlPage
            .querySelector('#MainContent_txtOddilNazev')
            ?.getAttribute('value')

        if (!parentClubName) {
            throw new FACRScraperElementNotFoundError(
                'parentClubName',
                'playerDetail',
                '#MainContent_txtOddilNazev',
            )
        }

        const parentClubFrom = playerDetailHtmlPage
            .querySelector('#MainContent_txtOd')
            ?.getAttribute('value')

        if (!parentClubFrom) {
            throw new FACRScraperElementNotFoundError(
                'parentClubFrom',
                'playerDetail',
                '#MainContent_txtOd',
            )
        }

        // * I do not check this as it can be undefined on purpose
        const loanClubId = playerDetailHtmlPage
            .querySelector('#MainContent_txtOddilHostId')
            ?.getAttribute('value')

        const loanClubName = playerDetailHtmlPage
            .querySelector('#MainContent_txtOddilHostNazev')
            ?.getAttribute('value')

        const loanFrom = playerDetailHtmlPage
            .querySelector('#MainContent_txtHostOd')
            ?.getAttribute('value')

        const loanTo = playerDetailHtmlPage
            .querySelector('#MainContent_txtHostDo')
            ?.getAttribute('value')

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
            let fromClub: string | null = null
            let when: string | null = null
            let event: string | null = null
            let period: {
                from: string
                to: string
            } | null = null

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

            // if "to" club is defined, then modify last item of an array (previous saved transfer has "to" club defined)
            if (!isNil(row.getAttribute('id'))) {
                const toClubEl = row.querySelector('td.oddil_do')?.innerText
                if (isNil(toClubEl)) {
                    throw new FACRScraperElementNotFoundError(
                        'toClubEl',
                        'playerDetail passport',
                        'td.oddil_do',
                    )
                }

                const lastTransfer = transfers[transfers.length - 1]
                // should not happen, but just to be sure unexpected error won't throw
                if (isNil(lastTransfer)) {
                    continue
                }
                lastTransfer.to = toClubEl.trim()
            } else {
                fromClub = firstCol.trim()
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

                const periodOfTransfer = row.querySelector('td:nth-child(2)')?.innerText
                if (isNil(periodOfTransfer)) {
                    throw new FACRScraperElementNotFoundError(
                        'periodOfTransfer',
                        'playerDetail passport',
                        'td:nth-child(2)',
                    )
                }

                const [periodFrom, periodTo] = periodOfTransfer?.split(' - ')
                period =
                    periodFrom !== '' && periodTo !== ''
                        ? {
                              from: periodFrom,
                              to: periodTo,
                          }
                        : null
                when = whenEvent.trim()
                event = eventName.trim()
            }
            if (fromClub && event && when) {
                transfers.push({
                    when,
                    event,
                    from: fromClub,
                    to: null,
                    period,
                })
            }
        }

        return {
            name,
            surname,
            dateOfBirth: fromFacrDate(dateOfBirth),
            facrId,
            facrMemberFrom: fromFacrDate(facrMemberFrom),
            parentClub: {
                clubFacrId: parentClubId,
                clubName: parentClubName,
                playingFrom: fromFacrDate(parentClubFrom),
            },
            gender: gender === 'Z' ? Gender.Female : Gender.Male,
            country,
            loanClub:
                !isNil(loanClubId) && !isNil(loanFrom) && !isNil(loanTo) && !isNil(loanClubName)
                    ? {
                          clubFacrId: loanClubId,
                          clubName: loanClubName,
                          playingFrom: fromFacrDate(loanFrom),
                          playingUntil: fromFacrDate(loanTo),
                      }
                    : null,
            transfers: transfers.map((transfer) => {
                return {
                    when: fromFacrDate(transfer.when),
                    event: transfer.event,
                    from: transfer.from,
                    to: transfer.to ?? null,
                    period: this.getTransferPeriod(transfer.period),
                }
            }),
        }
    }

    private getTransferPeriod(period: { from: string; to: string } | null) {
        if (isNil(period)) {
            return null
        }

        const [dayPeriodFrom] = period.from.split('.')
        const [dayPeriodTo] = period.to.split('.')

        return {
            from: dayPeriodFrom !== '' ? fromFacrDate(period.from) : '',
            to: dayPeriodTo !== '' ? fromFacrDate(period.to) : '',
        }
    }

    private async scrapePlayerDetailLinks(
        clubFacrId: string,
        launchedBrowser: Browser,
    ): Promise<PlayerLinks[]> {
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

        // select only players with selected club as a parent club
        await page.click('input#listTypVypisu_0')

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
        const idToDetailUrlsMap: PlayerLinks[] = []
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
