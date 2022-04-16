import { AppConfig } from '../../dependency/config/index'
import { Club } from '../../entities/Club'
import { fromFacrDateTime } from '../../utils/conversions'
import { NewClubRequest } from '../club/types'
import { NewCompetitionRequest } from '../competition/types'
import { NewMatchRequest } from '../match/types'
import { NewPlayerRequest } from '../player/types'
import chunk from '../utils/chunk'
import readFiles from '../utils/read-files'
import { sleep } from '../../utils/index'
import { AbstractScraper } from './AbstractScraper'
import { FACRScraperElementNotFoundError, FACRScraperNoHTMLS } from './errors'
import { PuppeteerBrowser } from './PuppeteerBrowser'
import { IFacrScraper, ScrapedClub, ScrapedCompetition, ScrapedMatchOverview } from './types'
import { HTMLElement } from 'node-html-parser'
import { Browser } from 'puppeteer'

export class FacrScraper extends AbstractScraper implements IFacrScraper {
    private facrCompetitionsUrl: string
    private facrMembersUrl: string

    // format of the competitions path is -> `${COMPETITION_X_PAGE_PATH_PREFIX}/[UUID]`
    private static readonly MATCH_DETAIL_PAGE_PATH_PREFIX = '/zapasy/zapas'

    constructor({ facrScraper }: AppConfig, private readonly puppeteerBrowser: PuppeteerBrowser) {
        super()
        this.facrCompetitionsUrl = facrScraper.facrCompetitionsUrl
        this.facrMembersUrl = facrScraper.facrMembersUrl
    }

    async scrapeCompetitions(): Promise<NewCompetitionRequest[]> {
        console.log('FACR Scraper: Starting to scrape competitions data.')

        const regionsParsedPage = await this.getParsedPage(`${this.facrCompetitionsUrl}/subjekty`)

        const regionsPaths = regionsParsedPage.querySelectorAll('div.box a.btn').map((atag) => {
            const href = atag.getAttribute('href')
            if (!href) {
                throw new FACRScraperElementNotFoundError(
                    'href in regionPaths',
                    'competitions',
                    'href',
                )
            }
            return href
        })

        if (!regionsPaths) {
            throw new FACRScraperElementNotFoundError(
                'regionPaths',
                'competitions',
                'div.box a.btn',
            )
        }

        const competitionsBasicDataFetchers = regionsPaths.map(async (regionPath) => {
            // #souteze anchor ensures that page opens with opened tab that we need, where table with competitions is hidden
            const parsedCompetitionPage = await this.getParsedPage(
                `${this.facrCompetitionsUrl}${regionPath}#souteze`,
            )
            const competitionRegionId = regionPath.split('/')[3]

            const competitionRegionName = parsedCompetitionPage.querySelector('h1.h1')?.innerText

            if (!competitionRegionId) {
                throw new FACRScraperElementNotFoundError('competitionRegionId', 'competitions')
            }

            if (!competitionRegionName) {
                throw new FACRScraperElementNotFoundError(
                    'competitionRegionName',
                    'competitions',
                    'h1.h1',
                )
            }
            return parsedCompetitionPage
                .querySelectorAll('#souteze table.table tbody tr')
                .map((row: HTMLElement) => {
                    const tableFirstRowContent = row.querySelector('td:nth-child(1)')
                    if (!tableFirstRowContent) {
                        throw new FACRScraperElementNotFoundError(
                            'tableFirstRowContent in #souteze table',
                            'competitions',
                            'td:nth-child(1)',
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
                        throw new FACRScraperElementNotFoundError(
                            'facrId',
                            'competitions',
                            'td:nth-child(1)',
                        )
                    }
                    if (!name) {
                        throw new FACRScraperElementNotFoundError(
                            'name',
                            'competitions',
                            'td:nth-child(2) a',
                        )
                    }
                    if (!facrUuid) {
                        throw new FACRScraperElementNotFoundError(
                            'facrUuid',
                            'competitions',
                            'td:nth-child(2) a',
                        )
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

        const scrapedCompetitionsData = await (
            await Promise.all(competitionsBasicDataFetchers)
        )
            .flat()
            // get rid of undefined elements
            .filter((competition): competition is ScrapedCompetition => !!competition)
            // get rid of duplicates
            .filter(
                (competition, index, array) =>
                    array.findIndex(({ facrId }) => facrId === competition.facrId) === index,
            )

        console.log(
            `FACR Scraper: Successfully scraped ${scrapedCompetitionsData.length} competitions.`,
        )

        return scrapedCompetitionsData
    }

    async scrapeClubs(dirname: string): Promise<NewClubRequest[]> {
        const htmlsToScrape: string[] = []
        readFiles(dirname, (_, content) => {
            htmlsToScrape.push(content)
        })

        if (!htmlsToScrape.length) {
            throw new FACRScraperNoHTMLS(dirname, 'clubs')
        }

        const scrapedClubs: ScrapedClub[] = htmlsToScrape
            .map((htmlToScrape) => {
                const parsedHtml = this.parseHtml(htmlToScrape)

                const tableElement = parsedHtml.querySelector(
                    '.container-content .table-container .table',
                )

                if (!tableElement) {
                    throw new FACRScraperElementNotFoundError(
                        'tableElement',
                        'clubs',
                        '.container-content .table-container .table',
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
                        throw new FACRScraperElementNotFoundError(
                            'nameColumn',
                            'clubs',
                            'td:nth-child(2)',
                        )
                    }
                    if (!clubLink) {
                        throw new FACRScraperElementNotFoundError(
                            'clubLink',
                            'clubs',
                            'td:nth-child(2) a',
                        )
                    }
                    if (!idColumn) {
                        throw new FACRScraperElementNotFoundError(
                            'idColumn',
                            'clubs',
                            'td:nth-child(3)',
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
            .filter((club): club is ScrapedClub => !!club)
            // To ensure that there are no duplicates
            .filter(
                (club, index, array) => array.findIndex((c) => c.facrId === club.facrId) === index,
            )

        console.log(`FACR Scraper: Successfully scraped ${scrapedClubs.length} clubs.`)

        return scrapedClubs
    }

    /**
     * Scrape players of all clubs using Chrome browser (puppeteer)
     */
    async scrapePlayersOfClubs(clubs: Club[]): Promise<Map<string, NewPlayerRequest[]>> {
        // I dont want to launch hundreds of browser in parallel...
        // This is why I run this sequentially with for cycle
        const scrapedPlayersLength = 0
        const chunks = chunk(clubs, 10)
        const clubPlayersListHtmlsMap = new Map<string, string[]>()
        const scrapedPlayersMap = new Map<string, NewPlayerRequest[]>()

        const browser = await this.puppeteerBrowser.launch()
        for (const chunk of chunks) {
            await sleep(500)
            const results = await Promise.allSettled(
                chunk.map(async (club) => {
                    if (!club.facrId) {
                        // TODO: custom error
                        throw new Error('Cannot scrape players of the club without facrId.')
                    }
                    console.info(
                        `FACR Scraper: Start scrape list of players of a club with id ${club.facrId} using browser.`,
                    )

                    const clubsPlayersListHtmls = await this.scrapeClubsPlayersListWithPuppeteer(
                        club.facrId,
                        browser,
                    )

                    clubPlayersListHtmlsMap.set(club.facrId, clubsPlayersListHtmls)

                    console.info(
                        `FACR Scraper: Finish scrape list of players of a club with id ${club.facrId}.`,
                    )
                }),
            )

            const rejected = results.filter((r) => r.status === 'rejected')
            rejected.forEach((r) => console.error(r))
        }
        await browser.close()

        for (const [clubId, playersListHtmls] of clubPlayersListHtmlsMap.entries()) {
            console.info('Scrape details of a players of a club: ', clubId)
            await this.scrapePlayersDetails(playersListHtmls)

            // scrapedPlayersMap.set(clubId, clubsScrapedPlayers)
            // scrapedPlayersLength += clubsScrapedPlayers.length
        }

        console.info(
            `FACR Scraper: Successfully scraped ${scrapedPlayersLength} players from all clubs.`,
        )

        return scrapedPlayersMap
    }

    private async scrapeClubsPlayersListWithPuppeteer(
        clubFacrId: Club['facrId'],
        launchedBrowser: Browser,
    ): Promise<string[]> {
        const timeout = 10 * 1000
        const browser = launchedBrowser
        const page = await browser.newPage()
        page.setDefaultTimeout(timeout)
        await page.setViewport({ width: 1705, height: 625 })
        try {
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
            await suggestedClubLinkElement.click()

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
            const htmlBodiesWithPlayers: string[] = []
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
                            'players',
                            '.pages .paging li:nth-last-child(2) a',
                        )
                    }
                    // navigate to the next page of players table
                    await nextPageLinkElement.click()
                    await page.waitForNavigation({ timeout })
                }
            }

            return htmlBodiesWithPlayers
        } catch (e) {
            throw e
        }
    }

    async scrapePlayersDetails(htmlsWithPlayersList: string[]) {
        const playersDetailPagesUrls: string[] = htmlsWithPlayersList
            .map((html) => {
                const parsedHtmlBody = this.parseHtml(html)
                const tableElement = parsedHtmlBody.querySelector(
                    '#MainContent_VypisHracu_gridData',
                )
                if (!tableElement) {
                    throw new FACRScraperElementNotFoundError(
                        'tableElement',
                        'players',
                        '#MainContent_VypisHracu_gridData',
                    )
                }

                const playersRows = tableElement.querySelectorAll('tr:not(.first)')
                if (!playersRows) {
                    throw new FACRScraperElementNotFoundError(
                        'playersRows',
                        'players',
                        'tr:not(.first)',
                    )
                }
                return playersRows
                    .filter((row) => {
                        const isActive =
                            row.querySelector('td:nth-child(10) img')?.getAttribute('title') ===
                            'ANO'
                        return isActive
                    })
                    .map((row) => {
                        return row.querySelector('td:nth-child(4) a')?.getAttribute('href')
                    })
                    .filter((url: string): url is string => !!url)
            })
            .flat()

        const scrapedPlayers: string[] = []
        const chunks = chunk(playersDetailPagesUrls, 5)
        for (const urlsChunk of chunks) {
            await sleep(1000)
            const players = await Promise.all(
                urlsChunk.map(async (detailUrl) => {
                    const parsedPage = await this.getParsedPage(
                        `${this.facrMembersUrl}/hraci/${detailUrl}`,
                    )

                    parsedPage.querySelector('#MainContent_panelBody')

                    return detailUrl
                }),
            )

            scrapedPlayers.push(...players)
        }

        console.log('details to mine', playersDetailPagesUrls.length)
        console.log('mined players', scrapedPlayers.flat().length)
        // console.log(scrapedPlayers.length)
    }

    async scrapeMatches(htmlsToScrape: string[]): Promise<NewMatchRequest[]> {
        console.time('scrapeMatches')
        console.info(
            `FACR Scraper: Start to scrape matches from HTML files ${htmlsToScrape.length}.`,
        )
        let totalMatchesToScrape = 0
        const scrapedMatchOverviews: ScrapedMatchOverview[] = htmlsToScrape
            .map((htmlToScrape) => {
                const parsedHtml = this.parseHtml(htmlToScrape)
                const matchRows = parsedHtml.querySelectorAll('.match-meta .row')

                return matchRows.map((matchRow) => {
                    const linkElement = matchRow.querySelector('div:nth-child(2) a')
                    if (!linkElement) {
                        return undefined
                    }

                    totalMatchesToScrape++

                    const url = linkElement.getAttribute('href')
                    if (!url) {
                        throw new FACRScraperElementNotFoundError('url', 'matches', 'href')
                    }
                    const facrUuid = url.split('/').slice(-1).pop()

                    const takePlace = matchRow.querySelector('div:nth-child(1)')?.innerText
                    if (!takePlace) {
                        throw new FACRScraperElementNotFoundError(
                            'takePlace',
                            'matches',
                            'div:nth-child(1)',
                        )
                    }

                    return {
                        facrUuid,
                        takePlace: takePlace.trim(),
                    }
                })
            })
            .flat()
            .filter(
                (scrapedMatchOverview): scrapedMatchOverview is ScrapedMatchOverview =>
                    !!scrapedMatchOverview,
            )

        const chunks = chunk(scrapedMatchOverviews, 5)
        const scrapedMatches: NewMatchRequest[] = []
        for (const chunk of chunks) {
            const scrapePromises = chunk.map(
                async (matchOverview) => await this.scrapeMatchDetailPage(matchOverview),
            )
            const scraped = (await Promise.all(scrapePromises)).filter(
                (scrapedMatch): scrapedMatch is NewMatchRequest => !!scrapedMatch,
            )

            scrapedMatches.push(...scraped)
        }

        console.timeEnd('scrapeMatches')
        console.info(
            `FACR Scraper: Successfully scraped ${scrapedMatches.length} matches from total ${totalMatchesToScrape} matches to scrape.`,
        )
        return scrapedMatches
    }

    private async scrapeMatchDetailPage(
        matchOverview: ScrapedMatchOverview,
    ): Promise<NewMatchRequest | undefined> {
        console.info(`FACR Scraper: Start to scrape a match: ${matchOverview.facrUuid}`)
        const { facrUuid, takePlace } = matchOverview
        let matchDetailHtml: HTMLElement | null = null
        const url = `${this.facrCompetitionsUrl}${FacrScraper.MATCH_DETAIL_PAGE_PATH_PREFIX}/${facrUuid}`
        try {
            matchDetailHtml = await this.getParsedPage(url)
        } catch (e) {
            console.warn(
                `FACR Scraper: Could not get parsed match detail page: ${url}. Skipping to the next match.`,
                e,
            )
            return
        }

        const competitionName = matchDetailHtml.querySelector('.container-content h1.h2')?.innerText
        if (!competitionName) {
            throw new FACRScraperElementNotFoundError(
                'competitionName',
                'matches',
                '.container-content h1.h2',
            )
        }

        const homeTeam = matchDetailHtml.querySelector(
            'h2.h2 .row div:nth-child(1) span',
        )?.innerText
        if (!homeTeam) {
            throw new FACRScraperElementNotFoundError(
                'homeTeam',
                'matches',
                'h2.h2 .row div:nth-child(1) span',
            )
        }

        const awayTeam = matchDetailHtml.querySelector(
            'h2.h2 .row div:nth-child(3) span',
        )?.innerText
        if (!awayTeam) {
            throw new FACRScraperElementNotFoundError(
                'awayTeam',
                'matches',
                'h2.h2 .row div:nth-child(3) span',
            )
        }

        let score: string | null = null
        const scoreContainer = matchDetailHtml.querySelector(
            'h2.h2 .row div:nth-child(2)',
        )?.innerText
        if (scoreContainer?.trim() !== '') {
            const scrapedScore = matchDetailHtml.querySelector(
                'h2.h2 .row div:nth-child(2) p.h2',
            )?.innerText
            if (!scrapedScore) {
                throw new FACRScraperElementNotFoundError(
                    'score',
                    `matches ${url}`,
                    'h2.h2 .row div:nth-child(2) p.h2',
                )
            }

            score = scrapedScore
        }

        let homeTeamScore: number | null = null
        let awayTeamScore: number | null = null
        if (score) {
            const [hScore, aScore] = score.split(':')
            homeTeamScore = parseInt(hScore)
            awayTeamScore = parseInt(aScore)
        }

        const homeTeamLineupRows = matchDetailHtml.querySelectorAll(
            '.container-content div:nth-child(5) div:nth-child(1) table.table tbody:nth-child(2) tr',
        )

        const homeTeamSubstitutesRows = matchDetailHtml.querySelectorAll(
            '.container-content div:nth-child(5) div:nth-child(1) table.table tbody:nth-child(4) tr',
        )

        const awayTeamLineupRows = matchDetailHtml.querySelectorAll(
            '.container-content div:nth-child(5) div:nth-child(2) table.table tbody:nth-child(2) tr',
        )

        const awayTeamSubstitutesRows = matchDetailHtml.querySelectorAll(
            '.container-content div:nth-child(5) div:nth-child(2) table.table tbody:nth-child(4) tr',
        )

        const homeTeamMatchLineup = this.scrapeMatchTeamLineup(
            homeTeamLineupRows,
            homeTeamSubstitutesRows,
        )

        const awayTeamMatchLineup = this.scrapeMatchTeamLineup(
            awayTeamLineupRows,
            awayTeamSubstitutesRows,
        )

        const goalscorersRows = matchDetailHtml.querySelectorAll(
            '.container-content>table.table tbody tr',
        )

        const goalScorers = this.scrapeGoalscorers(goalscorersRows)
        const homeTeamGoalscorers = goalScorers.filter((goalscorer) => goalscorer.team === homeTeam)
        const awayTeamGoalscorers = goalScorers.filter((goalscorer) => goalscorer.team === awayTeam)

        return {
            competition: competitionName,
            facrUuid,
            takePlace: fromFacrDateTime(takePlace),
            homeTeamScore,
            awayTeamScore,
            homeTeam,
            awayTeam,
            lineups: {
                home: homeTeamMatchLineup.map((matchPlayer) => {
                    return {
                        ...matchPlayer,
                        goals: homeTeamGoalscorers
                            .filter(
                                (homeGoalscorer) => homeGoalscorer.player === matchPlayer.fullname,
                            )
                            .map((goalScorer) => {
                                return {
                                    minute: goalScorer.minute,
                                    type: goalScorer.type,
                                }
                            }),
                        side: 'home',
                    }
                }),
                away: awayTeamMatchLineup.map((matchPlayer) => {
                    return {
                        ...matchPlayer,
                        goals: awayTeamGoalscorers
                            .filter(
                                (awayGoalscorer) => awayGoalscorer.player === matchPlayer.fullname,
                            )
                            .map((goalScorer) => {
                                return {
                                    minute: goalScorer.minute,
                                    type: goalScorer.type,
                                }
                            }),
                        side: 'away',
                    }
                }),
            },
        }
    }

    private scrapeMatchTeamLineup(lineupRows: HTMLElement[], substituteRows: HTMLElement[]) {
        const lineup = lineupRows.map((row) => {
            const shirt = row.querySelector('td:nth-child(1)')?.innerText?.trim()
            if (shirt === undefined) {
                throw new FACRScraperElementNotFoundError('shirt', 'matches', 'td:nth-child(1)')
            }

            const position = row.querySelector('td:nth-child(2) span')?.getAttribute('title')
            if (position === undefined) {
                throw new FACRScraperElementNotFoundError('position', 'matches', 'td:nth-child(2)')
            }

            const fullname = row.querySelector('td:nth-child(3)')?.innerText?.trim()
            if (fullname === undefined) {
                throw new FACRScraperElementNotFoundError('fullname', 'matches', 'td:nth-child(3)')
            }
            const yellowCard = row.querySelector('td:nth-child(4)')?.innerText?.trim()
            if (yellowCard === undefined) {
                throw new FACRScraperElementNotFoundError(
                    'yellowCard',
                    'matches',
                    'td:nth-child(4)',
                )
            }
            const redCard = row.querySelector('td:nth-child(5)')?.innerText?.trim()
            if (redCard === undefined) {
                throw new FACRScraperElementNotFoundError('redCard', 'matches', 'td:nth-child(5)')
            }
            const substitution = row.querySelector('td:nth-child(6)')?.innerText?.trim()
            if (substitution === undefined) {
                throw new FACRScraperElementNotFoundError(
                    'substitution',
                    'matches',
                    'td:nth-child(6)',
                )
            }

            return {
                shirt: shirt !== '' ? parseInt(shirt) : 0,
                position,
                // * Remove "Captain" flag.
                fullname: fullname.replace(' [K]', ''),
                yellowCardMinute: yellowCard !== '' ? +yellowCard : null,
                redCardMinute: redCard !== '' ? +redCard : null,
                substitution: substitution === '' ? null : substitution,
                isInStartingLineup: true,
            }
        })

        const substitutes = substituteRows.map((row) => {
            const shirt = row.querySelector('td:nth-child(1)')?.innerText?.trim()
            if (shirt === undefined) {
                throw new FACRScraperElementNotFoundError('shirt', 'matches', 'td:nth-child(1)')
            }

            const position = row.querySelector('td:nth-child(2) span')?.getAttribute('title')
            if (position === undefined) {
                throw new FACRScraperElementNotFoundError('position', 'matches', 'td:nth-child(2)')
            }

            const fullname = row.querySelector('td:nth-child(3)')?.innerText?.trim()
            if (fullname === undefined) {
                throw new FACRScraperElementNotFoundError('fullname', 'matches', 'td:nth-child(3)')
            }
            const yellowCard = row.querySelector('td:nth-child(4)')?.innerText?.trim()
            if (yellowCard === undefined) {
                throw new FACRScraperElementNotFoundError(
                    'yellowCard',
                    'matches',
                    'td:nth-child(4)',
                )
            }
            const redCard = row.querySelector('td:nth-child(5)')?.innerText?.trim()
            if (redCard === undefined) {
                throw new FACRScraperElementNotFoundError('redCard', 'matches', 'td:nth-child(5)')
            }
            const substitution = row.querySelector('td:nth-child(6)')?.innerText?.trim()
            if (substitution === undefined) {
                throw new FACRScraperElementNotFoundError(
                    'substitution',
                    'matches',
                    'td:nth-child(6)',
                )
            }

            return {
                shirt: shirt !== '' ? parseInt(shirt) : 0,
                position,
                fullname,
                yellowCardMinute: yellowCard !== '' ? +yellowCard : null,
                redCardMinute: redCard !== '' ? +redCard : null,
                substitution,
                isInStartingLineup: false,
            }
        })

        return [...lineup, ...substitutes]
    }

    private scrapeGoalscorers(goalScorerRows: HTMLElement[]) {
        return goalScorerRows.map((row) => {
            const team = row.querySelector('td:nth-child(1)')?.innerText?.trim()
            if (team === undefined) {
                throw new FACRScraperElementNotFoundError('team', 'matches', 'td:nth-child(1)')
            }
            const player = row.querySelector('td:nth-child(2)')?.innerText?.trim()
            if (player === undefined) {
                throw new FACRScraperElementNotFoundError('player', 'matches', 'td:nth-child(2)')
            }
            const type = row.querySelector('td:nth-child(3)')?.innerText?.trim()
            if (type === undefined) {
                throw new FACRScraperElementNotFoundError('type', 'matches', 'td:nth-child(3)')
            }
            const minute = row.querySelector('td:nth-child(4)')?.innerText?.trim()
            if (minute === undefined) {
                throw new FACRScraperElementNotFoundError('minute', 'matches', 'td:nth-child(4)')
            }

            return {
                team,
                player,
                type,
                minute: minute !== '' ? parseInt(minute) : 0,
            }
        })
    }

    private isTableEmpty(element: HTMLElement) {
        return element.innerText.includes('Tabulka neobsahuje žádné údaje')
    }

    // private toISO8601(date: string) {
    //     const [day, month, year] = date.split('.')
    //     return `${year}-${month}-${day}`
    // }
}
