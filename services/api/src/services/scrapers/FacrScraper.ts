import { HTMLElement } from 'node-html-parser'
import { AppConfig } from '../../dependency/config/index'
import { IScraper } from './types'

export class FacrScraper {
    private facrCompetitionUrl: string
    // private facrMembersUrl: string

    constructor(private readonly scraper: IScraper, { facrScraper }: AppConfig) {
        this.facrCompetitionUrl = facrScraper.facrCompetitionUrl
        // this.facrMembersUrl = facrScraper.facrMembersUrl
    }

    async getScrapedCompetitions() {
        console.log('FACR Scraper: Starting to scrape competitions data.')

        try {
            const regionsParsedPage = await this.scraper.getParsedPage(
                `${this.facrCompetitionUrl}/subjekty`,
            )

            const regionsPaths = regionsParsedPage.querySelectorAll('div.box a.btn').map((atag) => {
                return atag.getAttribute('href')
            })
            const competitionsBasicDataFetchers = regionsPaths.map(async (regionPath) => {
                // #souteze anchor ensures that page opens with opened tab that we need, where table with competitions is hidden
                const parsedCompetitionPage = await this.scraper.getParsedPage(
                    `${this.facrCompetitionUrl}${regionPath}#souteze`,
                )
                const competitionRegionName =
                    parsedCompetitionPage.querySelector('h1.h1')?.innerText
                return parsedCompetitionPage
                    .querySelectorAll('#souteze table.table tbody tr')
                    .map((row: HTMLElement) => {
                        return {
                            competitionRegionName,
                            competitionFacrId: row.querySelector('td:nth-child(1)')?.innerText,
                            competitionName: row.querySelector('td:nth-child(2) a')?.innerText,
                            competitionPath: row
                                .querySelector('td:nth-child(2) a')
                                ?.getAttribute('href'),
                        }
                    })
            })

            return await Promise.all(competitionsBasicDataFetchers).finally(() => {
                console.log('FACR Scraper: Successfully scraped competitions data.')
            })
        } catch (e) {
            console.error('FACR Scraper: Error while scraping competitions.', e)
        }
    }
}
