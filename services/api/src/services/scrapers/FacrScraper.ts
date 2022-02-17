import { AppConfig } from '../../dependency/config/index'
import { IScraper } from './types'

export class FacrScraper {
    constructor(private readonly scraper: IScraper, private readonly config: AppConfig) {}

    async getScrapedCompetitions() {
        try {
            const competitionsParsedPage = await this.scraper.getParsedPage(
                `${this.config.facrScraper.facrCompetitionUrl}/subjekty`,
            )

            const competitionsPaths = competitionsParsedPage
                .querySelectorAll('div.box a.btn')
                .map((atag) => {
                    return atag.getAttribute('href')
                })

            // TODO: scrpae individual competitions data (id, name, clubs table url)
            return competitionsPaths
        } catch (e) {
            console.error('FACR Scraper: Error while scraping competitions.', e)
        }
    }
}
