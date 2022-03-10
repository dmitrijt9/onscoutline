import { writeFileSync } from 'fs'
import { HTMLElement } from 'node-html-parser'
import { AppConfig } from '../../dependency/config/index'
import { Club } from '../../entities/Club'
import { Competition } from '../../entities/Competition'
import { ClubRepository } from '../../repositories/ClubRepository'
import { CompetitionRepository } from '../../repositories/CompetitionRepository'
import { PlayerService } from '../player/PlayerService'
import chunk from '../utils/chunk'
import readFiles from '../utils/read-files'
import { FACRScraperElementNotFoundError } from './errors'
import { PuppeteerBrowser } from './PuppeteerBrowser'
import { Scraper } from './Scraper'
import { IFacrScraper, ScrapedClub, ScrapedCompetition, ScrapedPlayer } from './types'

export class FacrScraper extends Scraper implements IFacrScraper {
    private facrCompetitionsUrl: string
    private facrMembersUrl: string

    // format of the competitions path is -> `${COMPETITION_X_PAGE_PATH_PREFIX}/[UUID]`
    private static readonly COMPETITION_CLUBS_PAGE_PATH_PREFIX = '/turnaje/team'
    // private COMPETITION_MATCHES_PAGE_PATH_PREFIX = '/turnaje/zapas'

    // private static readonly CLUB_MAIN_PAGE_PATH_PREFIX = '/club/club'

    constructor(
        { facrScraper }: AppConfig,
        private readonly competitionRepository: CompetitionRepository,
        private readonly clubRepository: ClubRepository,
        private readonly playerService: PlayerService,
        private readonly puppeteerBrowser: PuppeteerBrowser,
    ) {
        super()
        this.facrCompetitionsUrl = facrScraper.facrCompetitionsUrl
        this.facrMembersUrl = facrScraper.facrMembersUrl
    }

    async scrapeAndSaveCompetitions(): Promise<Competition[] | undefined> {
        console.log('FACR Scraper: Starting to scrape competitions data.')

        try {
            const regionsParsedPage = await this.getParsedPage(
                `${this.facrCompetitionsUrl}/subjekty`,
            )

            const regionsPaths = regionsParsedPage.querySelectorAll('div.box a.btn').map((atag) => {
                const href = atag.getAttribute('href')
                if (!href) {
                    throw new FACRScraperElementNotFoundError('href in regionPaths')
                }
                return href
            })

            if (!regionsPaths) {
                throw new FACRScraperElementNotFoundError('regionPaths')
            }

            const competitionsBasicDataFetchers = regionsPaths.map(async (regionPath) => {
                // #souteze anchor ensures that page opens with opened tab that we need, where table with competitions is hidden
                const parsedCompetitionPage = await this.getParsedPage(
                    `${this.facrCompetitionsUrl}${regionPath}#souteze`,
                )
                const competitionRegionId = regionPath.split('/')[3]

                const competitionRegionName =
                    parsedCompetitionPage.querySelector('h1.h1')?.innerText

                if (!competitionRegionId) {
                    throw new FACRScraperElementNotFoundError('competitionRegionId')
                }

                if (!competitionRegionName) {
                    throw new FACRScraperElementNotFoundError('competitionRegionName')
                }
                return parsedCompetitionPage
                    .querySelectorAll('#souteze table.table tbody tr')
                    .map((row: HTMLElement) => {
                        const tableFirstRowContent = row.querySelector('td:nth-child(1)')
                        if (!tableFirstRowContent) {
                            throw new FACRScraperElementNotFoundError(
                                'tableFirstRowContent in #souteze table',
                            )
                        }

                        if (this.isTableEmpty(tableFirstRowContent)) {
                            return undefined
                        }

                        const facrId = row.querySelector('td:nth-child(1)')?.innerText
                        const name = row.querySelector('td:nth-child(2) a')?.innerText
                        const facrUuid = row
                            .querySelector('td:nth-child(2) a')
                            ?.getAttribute('href')
                            ?.split('/')[3]

                        if (!facrId) {
                            throw new FACRScraperElementNotFoundError('facrId')
                        }
                        if (!name) {
                            throw new FACRScraperElementNotFoundError('name')
                        }
                        if (!facrUuid) {
                            throw new FACRScraperElementNotFoundError('facrUuid')
                        }
                        return {
                            regionName: competitionRegionName,
                            regionId: competitionRegionId,
                            facrId,
                            name,
                            facrUuid,
                        }
                    })
            })

            const competitionsData = (await (
                await Promise.all(competitionsBasicDataFetchers).finally(() => {
                    console.log('FACR Scraper: Successfully scraped competitions data.')
                })
            )
                .flat()
                // Type cast is ok here. We know that there won't be undefined competitions as we filter them here.
                .filter((c) => c != undefined)) as ScrapedCompetition[]

            const scrapedCompetitions = competitionsData.filter(
                (competition, index, array) =>
                    array.findIndex(({ facrId }) => facrId === competition.facrId) === index,
            )

            const currentCompetitions = await this.competitionRepository.find()

            const currentCompetitionsMap: Map<string, Competition> = currentCompetitions.reduce(
                (map: Map<string, Competition>, c: Competition) => {
                    map.set(`${c.regionId}:${c.facrId}`, c)
                    return map
                },
                new Map(),
            )

            const competitionsToInsert = scrapedCompetitions.filter(
                ({ facrId, regionId }) => !currentCompetitionsMap.get(`${regionId}:${facrId}`),
            )

            const competitionsToUpdate = scrapedCompetitions
                .filter(({ facrId, regionId }) =>
                    currentCompetitionsMap.get(`${regionId}:${facrId}`),
                )
                .map(({ facrId, facrUuid, name, regionId, regionName }) => {
                    return {
                        ...currentCompetitionsMap.get(`${regionId}:${facrId}`),
                        facrUuid,
                        name,
                        regionName,
                    }
                })

            return await this.competitionRepository
                .save([...competitionsToInsert, ...competitionsToUpdate])
                .finally(() => {
                    console.log(
                        `FACR Scraper: Successfully saved ${competitionsToInsert.length} new competitions.`,
                    )
                })
        } catch (e) {
            console.error('FACR Scraper: Error while scraping competitions.', e)
        }
    }

    async saveClubListsUrlsToFile(filePath: string): Promise<void> {
        console.log('FACR Scraper: Starting to get clubs data.')

        try {
            const competitions = await this.competitionRepository.find()
            if (competitions.length <= 0) {
                console.log('FACR Scraper: No competitions to get clubs lists.')
                return
            }

            const urls = competitions.map((c) => {
                return `${this.facrCompetitionsUrl}${FacrScraper.COMPETITION_CLUBS_PAGE_PATH_PREFIX}/${c.facrUuid}`
            })
            const chunks = chunk(urls, 100)

            for (const [i, chunk] of chunks.entries()) {
                const dataToWrite = chunk.reduce((dataToWrite: string, url: string) => {
                    dataToWrite += url + '\n'
                    return dataToWrite
                }, '')

                writeFileSync(`${i}-${filePath}`, dataToWrite, 'utf-8')
            }
        } catch (e) {
            console.error('FACR Scraper: Error while getting clubs lists.', e)
        }
    }

    async scrapeAndSaveClubs(dirname: string): Promise<Club[] | undefined> {
        const htmlsToScrape: string[] = []
        try {
            readFiles(dirname, (_, content) => {
                htmlsToScrape.push(content)
            })
        } catch (e) {
            console.error('FACR Scraper: Error while scraping clubs.', e)
            return
        }

        const clubsData: ScrapedClub[] = htmlsToScrape
            .map((htmlToScrape) => {
                const parsedHtml = this.parseHtml(htmlToScrape)

                const tableElement = parsedHtml.querySelector(
                    '.container-content .table-container .table',
                )

                if (!tableElement) {
                    throw new Error(
                        'FACR Scraper: Error while scraping clubs. Table element not found.',
                    )
                }

                if (this.isTableEmpty(parsedHtml)) {
                    console.log('FACR Scraper: No clubs to scrape.')
                    return
                }

                const tableRows = parsedHtml.querySelectorAll(
                    '.container-content .table-container .table tbody tr',
                )

                const clubsData = tableRows.map((clubRow) => {
                    const nameColumn = clubRow.querySelector('td:nth-child(2)')
                    const clubLink = clubRow.querySelector('td:nth-child(2) a')
                    const idColumn = clubRow.querySelector('td:nth-child(3)')
                    if (!nameColumn) {
                        // TODO: custom error for scraper missconfigurations, clubRow as a payload
                        throw new Error(
                            `FACR Scraper: Failed to scrape clubs. Query selector: 'td:nth-child(2)'`,
                        )
                    }
                    if (!clubLink) {
                        // TODO: custom error for scraper missconfigurations, clubRow as a payload
                        throw new Error(
                            `FACR Scraper: Failed to scrape clubs. Query selector: 'td:nth-child(2) a'`,
                        )
                    }
                    if (!idColumn) {
                        // TODO: custom error for scraper missconfigurations, clubRow as a payload
                        throw new Error(
                            `FACR Scraper: Failed to scrape clubs. Query selector: 'td:nth-child(3)'`,
                        )
                    }
                    return {
                        name: nameColumn.innerText,
                        facrId: idColumn.innerText,
                        facrUuid: clubLink.getAttribute('href')?.split('/')[5],
                    }
                })

                return clubsData
            })
            .flat()
            // Type cast is ok here. We know that there won't be undefined clubs as we filter them here.
            .filter((club) => club !== undefined) as ScrapedClub[]

        // To ensure that there are no duplicates
        const scrapedClubs: ScrapedClub[] = clubsData.filter(
            (club, index, array) => array.findIndex((c) => c.facrId === club.facrId) === index,
        )

        const currentClubs = await this.clubRepository.find()
        const currentClubsMap: Map<string, Club> = currentClubs.reduce(
            (map: Map<string, Club>, c: Club) => {
                map.set(c.facrId, c)
                return map
            },
            new Map(),
        )

        const clubsToInsert = scrapedClubs.filter(({ facrId }) => !currentClubsMap.get(facrId))

        const clubsToUpdate = scrapedClubs
            .filter(({ facrId }) => currentClubsMap.get(facrId))
            .map(({ facrId, facrUuid, name }) => {
                return {
                    ...currentClubsMap.get(facrId),
                    facrUuid,
                    name,
                }
            })

        return await this.clubRepository.save([...clubsToInsert, ...clubsToUpdate]).finally(() => {
            console.log(`FACR Scraper: Successfully saved ${clubsToInsert.length} new clubs.`)
        })
    }

    /**
     * Scrape players of all clubs using Chrome browser (puppeteer)
     */
    async scrapeAndSavePlayersOfAllClubs() {
        const clubs = await this.clubRepository.find()

        if (!clubs.length) {
            // TODO: custom error
            throw Error('FACR Scraper: No clubs to scrape players for.')
        }
        // I dont want to launch hundreds of browser in parallel...
        // This is why I run this sequentially wit for cycle
        let scrapedPlayersLength = 0
        const chunks = chunk(clubs, 2)

        for (const chunk of chunks) {
            const results = await Promise.allSettled(
                chunk.map(async (c) => {
                    const clubsPlayers = await this.scrapePlayersWithPuppeteer(c.facrId)
                    await this.playerService.saveScrapedPlayersOfAClub(clubsPlayers, c)
                    scrapedPlayersLength += clubsPlayers.length
                }),
            )

            const rejected = results.filter((r) => r.status === 'rejected')
            rejected.forEach((r) => console.error(r))
        }
        console.info(
            `FACR Scraper: Successfully scraped and saved ${scrapedPlayersLength} players from all clubs.`,
        )
    }

    /**
     * Scrape players of a given club using Chrome browser (puppeteer)
     */
    async scrapeAndSavePlayersOfAClub(clubFacrId: string): Promise<void> {
        const club = await this.clubRepository.findOne({
            where: {
                facrId: clubFacrId,
            },
        })

        if (!club) {
            // TODO: custom error
            throw Error('FACR Scraper: Could not find a club.')
        }

        const scrapedPlayers: ScrapedPlayer[] = await this.scrapePlayersWithPuppeteer(club.facrId)
        await this.playerService.saveScrapedPlayersOfAClub(scrapedPlayers, club)
        console.info(
            `FACR Scraper: Successfully scraped ${scrapedPlayers.length} players from the club ${clubFacrId}.`,
        )
    }

    private async scrapePlayersWithPuppeteer(clubFacrId: Club['facrId']): Promise<ScrapedPlayer[]> {
        const timeout = 10 * 1000
        const browser = await this.puppeteerBrowser.launch()
        const page = await browser.newPage()
        page.setDefaultTimeout(timeout)
        await page.setViewport({ width: 1705, height: 625 })
        console.info(`FACR Scraper: Start scrape players of a club with id ${clubFacrId}.`)
        try {
            await Promise.all([
                page.waitForNavigation(),
                page.goto(`${this.facrMembersUrl}/clenove/databaze-clenu.aspx`),
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
                    '#ctl00_MainContent_OddilBoxClenem_txtCisloKlubu',
                )
            }

            await this.puppeteerBrowser.scrollIntoViewIfNeeded(numberOfClubInputElement, timeout)

            // write club id to right input field
            await numberOfClubInputElement.focus()
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
                    '.ui-autocomplete .ui-menu-item a',
                )
            }
            await this.puppeteerBrowser.scrollIntoViewIfNeeded(suggestedClubLinkElement, timeout)
            // click on suggested club
            await suggestedClubLinkElement.click()

            // find main button to trigger search
            const searchButtonElement = await this.puppeteerBrowser.waitForSelectors(
                ['#MainContent_btnSearch > span'],
                page,
                {
                    timeout,
                    visible: true,
                },
            )
            if (!searchButtonElement) {
                throw new FACRScraperElementNotFoundError(
                    'searchButtonElement',
                    '#MainContent_btnSearch > span',
                )
            }
            await this.puppeteerBrowser.scrollIntoViewIfNeeded(searchButtonElement, timeout)
            // click search button
            await searchButtonElement.click()

            // Start players mining part...
            const htmlBodiesWithPlayers: string[] = []
            // hardcoded - current settings on is.fotbal.cz web
            const itemsPerPage = 20
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
                    throw new FACRScraperElementNotFoundError('bodyElement', 'body')
                }
                const currentPageHtml = await bodyElement.evaluate((element) => element.innerHTML)
                htmlBodiesWithPlayers.push(currentPageHtml)
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
                            '.pages .paging li:nth-last-child(2) a',
                        )
                    }
                    // navigate to the next page of players table
                    await nextPageLinkElement.click()
                    await page.waitForNavigation({ timeout })
                }
            }

            const scrapedPlayers: (ScrapedPlayer | undefined)[] = htmlBodiesWithPlayers
                .map((htmlBody) => {
                    const parsedHtmlBody = this.parseHtml(htmlBody)
                    const tableElement = parsedHtmlBody.querySelector(
                        '#MainContent_VypisClenu1_gridData',
                    )
                    if (!tableElement) {
                        throw new FACRScraperElementNotFoundError(
                            'tableElement',
                            '#MainContent_VypisClenu1_gridData',
                        )
                    }

                    const tableRowElemnts = tableElement.querySelectorAll('tr:not(.first)')

                    if (!tableRowElemnts) {
                        throw new FACRScraperElementNotFoundError(
                            'tableRowElemnts',
                            'tr:not(.first)',
                        )
                    }

                    return tableRowElemnts.map((rowElement) => {
                        const facrId = rowElement.querySelector('td.first')?.innerText
                        if (!facrId) {
                            throw new FACRScraperElementNotFoundError('player facrId', 'td.first')
                        }

                        if (facrId === '&nbsp;') {
                            return
                        }

                        const surname = rowElement.querySelector('td:nth-child(2) a')?.innerText
                        if (!surname) {
                            throw new FACRScraperElementNotFoundError(
                                'player surname',
                                'td:nth-child(2) a',
                            )
                        }

                        const name = rowElement.querySelector('td:nth-child(3) a')?.innerText
                        if (!name) {
                            throw new FACRScraperElementNotFoundError(
                                'player name',
                                'td:nth-child(3) a',
                            )
                        }
                        const yearOfBirth = rowElement.querySelector('td:nth-child(4)')?.innerText
                        if (!yearOfBirth) {
                            throw new FACRScraperElementNotFoundError(
                                'player yearOfBirth',
                                'td:nth-child(4)',
                            )
                        }

                        let playingFrom = rowElement.querySelector('td:nth-child(7)')?.innerText
                        if (!playingFrom) {
                            throw new FACRScraperElementNotFoundError(
                                'player playingFrom',
                                'td:nth-child(7)',
                            )
                        }
                        playingFrom = this.toISO8601(playingFrom)

                        let facrMemberFrom = rowElement.querySelector('td:nth-child(8)')?.innerText
                        if (!facrMemberFrom) {
                            throw new FACRScraperElementNotFoundError(
                                'player facrMemberFrom',
                                'td:nth-child(8)',
                            )
                        }
                        facrMemberFrom =
                            facrMemberFrom === '&nbsp;' ? undefined : this.toISO8601(facrMemberFrom)

                        return {
                            facrId,
                            surname,
                            name,
                            yearOfBirth,
                            playingFrom,
                            facrMemberFrom,
                        }
                    })
                })
                .flat()
                .filter((p) => p !== undefined)

            console.info(
                `FACR Scraper: Finish scrape players of a club with id ${clubFacrId}. Scraped ${scrapedPlayers.length} players.`,
            )
            return scrapedPlayers as ScrapedPlayer[]
        } catch (e) {
            throw e
        } finally {
            await browser.close()
        }
    }

    private isTableEmpty(element: HTMLElement) {
        return element.innerText.includes('Tabulka neobsahuje žádné údaje')
    }

    private toISO8601(date: string) {
        const [day, month, year] = date.split('.')
        return `${year}-${month}-${day}`
    }
}
