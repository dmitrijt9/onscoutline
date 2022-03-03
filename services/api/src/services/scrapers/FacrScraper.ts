import { writeFileSync } from 'fs'
import { HTMLElement } from 'node-html-parser'
import { AppConfig } from '../../dependency/config/index'
import { Club } from '../../entities/Club'
import { Competition } from '../../entities/Competition'
import { ClubRepository } from '../../repositories/ClubRepository'
import { CompetitionRepository } from '../../repositories/CompetitionRepository'
import chunk from '../utils/chunk'
import readFiles from '../utils/read-files'
import { Scraper } from './Scraper'
import { IFacrScraper, ScrapedClub, ScrapedCompetition } from './types'

export class FacrScraper extends Scraper implements IFacrScraper {
    private facrCompetitionsUrl: string
    // private facrMembersUrl: string

    // format of the competitions path is -> `${COMPETITION_X_PAGE_PATH_PREFIX}/[UUID]`
    private static readonly COMPETITION_CLUBS_PAGE_PATH_PREFIX = '/turnaje/team'
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

    async scrapeAndSaveCompetitions(): Promise<Competition[] | undefined> {
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

                if (!competitionRegionId) {
                    throw new Error(
                        'FACR Scraper: Failed to scrape competitions. Could not get competitionRegionId.',
                    )
                }

                if (!competitionRegionName) {
                    throw new Error(
                        'FACR Scraper: Failed to scrape competitions. Could not get competitionRegionName.',
                    )
                }
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

                        const facrId = row.querySelector('td:nth-child(1)')?.innerText
                        const name = row.querySelector('td:nth-child(2) a')?.innerText
                        const facrUuid = row
                            .querySelector('td:nth-child(2) a')
                            ?.getAttribute('href')
                            ?.split('/')[3]

                        if (!facrId) {
                            throw new Error(
                                'FACR Scraper: Failed to scrape competitions. Could not get facrId.',
                            )
                        }
                        if (!name) {
                            throw new Error(
                                'FACR Scraper: Failed to scrape competitions. Could not get name.',
                            )
                        }
                        if (!facrUuid) {
                            throw new Error(
                                'FACR Scraper: Failed to scrape competitions. Could not get facrUuid.',
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

    private isTableEmpty(element: HTMLElement) {
        return element.innerText.includes('Tabulka neobsahuje žádné údaje')
    }
}
