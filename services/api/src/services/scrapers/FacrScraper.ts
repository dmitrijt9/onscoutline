import { HTMLElement } from 'node-html-parser'
import { AppConfig } from '../../dependency/config/index'
import { Competition } from '../../entities/Competition'
import { ClubRepository } from '../../repositories/ClubRepository'
import { CompetitionRepository } from '../../repositories/CompetitionRepository'
import { Scraper } from './Scraper'

export class FacrScraper extends Scraper {
    private facrCompetitionsUrl: string
    // private facrMembersUrl: string

    // format of the competitions path is -> `${COMPETITION_X_PAGE_PATH_PREFIX}/[UUID]`
    // private COMPETITION_MAIN_PAGE_PATH_PREFIX = '/turnaje/hlavni'
    // private static readonly COMPETITION_CLUBS_PAGE_PATH_PREFIX = '/turnaje/team'
    // private COMPETITION_MATCHES_PAGE_PATH_PREFIX = '/turnaje/zapas'

    // private static readonly CLUB_MAIN_PAGE_PATH_PREFIX = '/club/club'

    constructor(
        { facrScraper }: AppConfig,
        private readonly competitionRepository: CompetitionRepository,
        private readonly clubRepository: ClubRepository,
    ) {
        super()
        this.facrCompetitionsUrl = facrScraper.facrCompetitionsUrl
        // this.facrMembersUrl = facrScraper.facrMembersUrl
    }

    async scrapeAndSaveCompetitions() {
        console.log('FACR Scraper: Starting to scrape competitions data.')

        try {
            const regionsParsedPage = await this.getParsedPage(
                `${this.facrCompetitionsUrl}/subjekty`,
            )

            const regionsPaths = regionsParsedPage.querySelectorAll('div.box a.btn').map((atag) => {
                const href = atag.getAttribute('href')
                if (!href) {
                    // TODO: custom error
                    throw new Error(
                        `FACR Scraper: Failed to scrape competitions. Query selector: 'div.box a.btn'. Attribute 'href'`,
                    )
                }
                return href
            })

            if (!regionsPaths) {
                // TODO: custom error
                throw new Error(
                    `FACR Scraper: Failed to scrape competitions. Query selector: 'div.box a.btn'`,
                )
            }

            const competitionsBasicDataFetchers = regionsPaths.map(async (regionPath) => {
                // #souteze anchor ensures that page opens with opened tab that we need, where table with competitions is hidden
                const parsedCompetitionPage = await this.getParsedPage(
                    `${this.facrCompetitionsUrl}${regionPath}#souteze`,
                )
                const competitionRegionId = regionPath.split('/')[3]

                const competitionRegionName =
                    parsedCompetitionPage.querySelector('h1.h1')?.innerText
                return parsedCompetitionPage
                    .querySelectorAll('#souteze table.table tbody tr')
                    .map((row: HTMLElement) => {
                        const tableFirstRowContent = row.querySelector('td:nth-child(1)')
                        if (!tableFirstRowContent) {
                            throw new Error(
                                'FACR Scraper: Failed to scrape competitions. Query selector: td:nth-child(1)',
                            )
                        }

                        if (this.isTableEmpty(tableFirstRowContent)) {
                            return undefined
                        }

                        // TODO: add validation to query selectors -> throw custom errors if selector not valid..
                        return {
                            regionName: competitionRegionName,
                            regionId: competitionRegionId,
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

            // Type cast is ok here. We know that there won't be undefined competitions as we filter them here.
            const scrapedCompetitions = competitionsData.filter(
                (c) => c != undefined,
            ) as Competition[]

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

            await this.competitionRepository.save([
                ...competitionsToInsert,
                ...competitionsToUpdate,
            ])
        } catch (e) {
            console.error('FACR Scraper: Error while scraping competitions.', e)
        }
    }

    async scrapeAndSaveClubs() {
        console.log('FACR Scraper: Starting to scrape clubs data.')

        try {
            const competitions = await this.competitionRepository.find()
            if (competitions.length <= 0) {
                console.log('FACR Scraper: No competitions to scrape clubs.')
                return
            }

            competitions.map(async (competition) => {
                // const clubsParsedPage = await this.getParsedPage(
                //     `${this.facrCompetitionsUrl}${FacrScraper.COMPETITION_CLUBS_PAGE_PATH_PREFIX}/${competition.facrUuid}`,
                // )
                // const tableRows = clubsParsedPage.querySelectorAll(
                //     '.container-content .table-container .table tbody tr',
                // )
                // const leagueName = clubsParsedPage.querySelector('.h3')?.innerText
                // console.log('tableRows', tableRows, leagueName)
                // tableRows
                //     .map((clubRow) => {
                //         console.log(clubRow)
                //         const nameColumn = clubRow.querySelector('td:nth-child(2)')
                //         const clubLink = clubRow.querySelector('td:nth-child(2) a')
                //         const idColumn = clubRow.querySelector('td:nth-child(3)')
                //         if (!nameColumn) {
                //             // TODO: custom error for scraper missconfigurations, clubRow as a payload
                //             throw new Error(
                //                 `FACR Scraper: Failed to scrape clubs. Query selector: 'td:nth-child(2)'`,
                //             )
                //         }
                //         if (!clubLink) {
                //             // TODO: custom error for scraper missconfigurations, clubRow as a payload
                //             throw new Error(
                //                 `FACR Scraper: Failed to scrape clubs. Query selector: 'td:nth-child(2) a'`,
                //             )
                //         }
                //         if (!idColumn) {
                //             // TODO: custom error for scraper missconfigurations, clubRow as a payload
                //             throw new Error(
                //                 `FACR Scraper: Failed to scrape clubs. Query selector: 'td:nth-child(3)'`,
                //             )
                //         }
                //         return {
                //             name: nameColumn.innerText,
                //             facrId: idColumn.innerText,
                //             facrUuid: clubLink.getAttribute('href')?.split('/')[3],
                //         }
                //     })
                //     .flat()
                // return tableRows
            })

            // const clubs = (
            //     await Promise.all(clubsDataFetchers).finally(() => {
            //         console.log('FACR Scraper: Successfully scraped clubs data.')
            //     })
            // ).flat()

            // To ensure that there are no duplicates
            // const clubsSet = new Set(clubs)
            // console.log(clubsSet)

            await this.clubRepository.save([])
        } catch (e) {
            console.error('FACR Scraper: Error while scraping clubs.', e)
        }
    }

    private isTableEmpty(element: HTMLElement) {
        return element.innerText.includes('Tabulka neobsahuje žádné údaje')
    }
}
