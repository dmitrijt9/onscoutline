import { AppConfig } from '../../dependency/config/index'
import { NewClubRequest } from '../club/types'
import { NewCompetitionRequest } from '../competition/types'
import readFiles from '../utils/read-files'
import { AbstractScraper } from './AbstractScraper'
import { FACRScraperElementNotFoundError, FACRScraperNoHTMLS } from './errors'
import { ScrapedClub, ScrapedCompetition } from './types'
import { HTMLElement } from 'node-html-parser'

export class FacrCompetitionsScraper extends AbstractScraper {
    private facrCompetitionsUrl: string

    constructor({ facrScraper }: AppConfig) {
        super()
        this.facrCompetitionsUrl = facrScraper.facrCompetitionsUrl
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

    private isTableEmpty(element: HTMLElement) {
        return element.innerText.includes('Tabulka neobsahuje žádné údaje')
    }

    // private toISO8601(date: string) {
    //     const [day, month, year] = date.split('.')
    //     return `${year}-${month}-${day}`
    // }
}
