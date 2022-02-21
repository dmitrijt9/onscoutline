import { HTMLElement } from 'node-html-parser'
import { AppConfig } from '../../dependency/config/index'
import { CompetitionRepository } from '../../repositories/CompetitionRepository'
import { IScraper } from './types'

export class FacrScraper {
    private facrCompetitionsUrl: string
    // private facrMembersUrl: string

    // format of the competitions path is -> `${COMPETITION_X_PAGE_PATH_PREFIX}/[UUID]`
    // private COMPETITION_MAIN_PAGE_PATH_PREFIX = '/turnaje/hlavni'
    private static readonly COMPETITION_CLUBS_PAGE_PATH_PREFIX = '/turnaje/team'
    // private COMPETITION_MATCHES_PAGE_PATH_PREFIX = '/turnaje/zapas'

    constructor(
        private readonly scraper: IScraper,
        { facrScraper }: AppConfig,
        private readonly competitionRepository: CompetitionRepository,
    ) {
        this.facrCompetitionsUrl = facrScraper.facrCompetitionsUrl
        // this.facrMembersUrl = facrScraper.facrMembersUrl
    }

    // TODO: Save region paths to database
    async scrapeAndSaveCompetitions() {
        console.log('FACR Scraper: Starting to scrape competitions data.')

        try {
            const regionsParsedPage = await this.scraper.getParsedPage(
                `${this.facrCompetitionsUrl}/subjekty`,
            )

            const regionsPaths = regionsParsedPage.querySelectorAll('div.box a.btn').map((atag) => {
                return atag.getAttribute('href')
            })
            const competitionsBasicDataFetchers = regionsPaths.map(async (regionPath) => {
                // #souteze anchor ensures that page opens with opened tab that we need, where table with competitions is hidden
                const parsedCompetitionPage = await this.scraper.getParsedPage(
                    `${this.facrCompetitionsUrl}${regionPath}#souteze`,
                )
                const competitionRegionName =
                    parsedCompetitionPage.querySelector('h1.h1')?.innerText
                return parsedCompetitionPage
                    .querySelectorAll('#souteze table.table tbody tr')
                    .map((row: HTMLElement) => {
                        return {
                            regionName: competitionRegionName,
                            facrId: row.querySelector('td:nth-child(1)')?.innerText,
                            name: row.querySelector('td:nth-child(2) a')?.innerText,
                            facrUuid: row
                                .querySelector('td:nth-child(2) a')
                                ?.getAttribute('href')
                                ?.split('/')[3],
                        }
                    })
            })

            const competitionsData = await (
                await Promise.all(competitionsBasicDataFetchers).finally(() => {
                    console.log('FACR Scraper: Successfully scraped competitions data.')
                })
            ).flat()

            await this.competitionRepository.save(competitionsData)
        } catch (e) {
            console.error('FACR Scraper: Error while scraping competitions.', e)
        }
    }

    // TODO: save clubs to database
    async getScrapedClubs() {
        console.log('FACR Scraper: Starting to scrape clubs data.')

        try {
            const competitions = await this.competitionRepository.find()
            if (competitions.length <= 0) {
                console.log('FACR Scraper: No competitions to scrape clubs.')
                return
            }
            const clubsDataFetchers = competitions.map(async (competition) => {
                const clubsParsedPage = await this.scraper.getParsedPage(
                    `${FacrScraper.COMPETITION_CLUBS_PAGE_PATH_PREFIX}/${competition.facrUuid}`,
                )

                return clubsParsedPage
                    .querySelectorAll('.table-container table.table tbody tr')
                    .map((clubRow) => {
                        const nameColumn = clubRow.querySelector('td:nth-child(2)')
                        const clubLink = clubRow.querySelector('td:nth-child(2) a')
                        const idColumn = clubRow.querySelector('td:nth-child(3)')
                        if (!nameColumn) {
                            // TODO: custom error for scraper missconfigurations, clubRow as a payload
                            throw new Error(
                                `FACR Scraper: Failed to scrape clubs. Query selector: ${nameColumn}`,
                            )
                        }

                        if (!clubLink) {
                            // TODO: custom error for scraper missconfigurations, clubRow as a payload
                            throw new Error(
                                `FACR Scraper: Failed to scrape clubs. Query selector: ${clubLink}`,
                            )
                        }

                        if (!idColumn) {
                            // TODO: custom error for scraper missconfigurations, clubRow as a payload
                            throw new Error(
                                `FACR Scraper: Failed to scrape clubs. Query selector: ${idColumn}`,
                            )
                        }
                        return {
                            clubName: nameColumn.innerText,
                            clubFacrPath: clubLink.getAttribute('href'),
                            clubFacrId: idColumn.innerText,
                            clubFacrUuid: clubLink.getAttribute('href')?.split('/')[3],
                        }
                    })
                    .flat()
            })

            const clubs = (
                await Promise.all(clubsDataFetchers).finally(() => {
                    console.log('FACR Scraper: Successfully scraped clubs data.')
                })
            ).flat()

            // To ensure that there are no duplicates
            const clubsSet = new Set(clubs)

            // Convert Set back to array
            return [...clubsSet]
        } catch (e) {
            console.error('FACR Scraper: Error while scraping clubs.', e)
        }
    }
}
