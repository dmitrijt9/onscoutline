import { NewClubRequest } from '../club/types'
import readFiles from '../utils/read-files'
import { AbstractScraper } from './AbstractScraper'
import { FACRScraperElementNotFoundError, FACRScraperNoHTMLS } from './errors'
import { ScrapedClub } from './types'
import { HTMLElement } from 'node-html-parser'

export class FacrClubsScraper extends AbstractScraper {
    constructor() {
        super()
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
}
