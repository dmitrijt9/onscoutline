import { writeFileSync } from 'fs'
import { AppConfig } from '../../dependency/config/index'
import { Competition } from '../../entities/Competition'
import { Season } from '../../entities/Season'
import { CompetitionHasSeasonRepository } from '../../repositories/competition/CompetitionHasSeasonRepository'
import { CompetitionRepository } from '../../repositories/competition/CompetitionRepository'
import chunk from '../utils/chunk'
import { NewCompetitionRequest } from './types'

export class CompetitionService {
    private facrCompetitionsUrl: string
    private static readonly COMPETITION_CLUBS_PAGE_PATH_PREFIX = '/turnaje/team'
    private static readonly COMPETITION_MATCHES_PAGE_PATH_PREFIX = '/turnaje/zapas'
    constructor(
        private readonly competitionRepository: CompetitionRepository,
        private readonly competitionHasSeasonRepository: CompetitionHasSeasonRepository,
        { facrScraper }: AppConfig,
    ) {
        this.facrCompetitionsUrl = facrScraper.facrCompetitionsUrl
    }

    async saveNewCompetitions(newCompetitions: NewCompetitionRequest[]): Promise<Competition[]> {
        const currentCompetitions = await this.competitionRepository.find()

        const currentCompetitionsMap: Map<string, Competition> = currentCompetitions.reduce(
            (map: Map<string, Competition>, c: Competition) => {
                map.set(`${c.regionId}:${c.facrId}`, c)
                return map
            },
            new Map(),
        )

        const competitionsToInsert = newCompetitions.filter(
            ({ facrId, regionId }) => !currentCompetitionsMap.get(`${regionId}:${facrId}`),
        )

        const competitionsToUpdate = newCompetitions
            .filter(({ facrId, regionId }) => currentCompetitionsMap.get(`${regionId}:${facrId}`))
            .map(({ facrId, facrUuid, name, regionId, regionName }) => {
                return {
                    ...currentCompetitionsMap.get(`${regionId}:${facrId}`),
                    facrUuid,
                    name,
                    regionName,
                }
            })

        console.info(`Competitions: Inserted ${competitionsToInsert.length} new competitions.`)
        console.info(`Competitions: Updated ${competitionsToUpdate.length} existing competitions.`)

        return await this.competitionRepository.save([
            ...competitionsToInsert,
            ...competitionsToUpdate,
        ])
    }

    async writeUrlsOfListsOfClubsToFile(filePath: string): Promise<void> {
        console.log('Competitions: Starting to get urls of lists of clubs from competitions.')

        const competitions = await this.competitionRepository.find()
        if (competitions.length <= 0) {
            console.log(
                'Competitions: No competitions to get clubs lists. Need to scrape competitions first.',
            )
            return
        }

        const urls = competitions.map(({ facrUuid }) => {
            return `${this.facrCompetitionsUrl}${CompetitionService.COMPETITION_CLUBS_PAGE_PATH_PREFIX}/${facrUuid}`
        })
        const chunks = chunk(urls, 100)

        for (const [i, chunk] of chunks.entries()) {
            const dataToWrite = chunk.reduce((dataToWrite: string, url: string) => {
                dataToWrite += url + '\n'
                return dataToWrite
            }, '')

            writeFileSync(`${i}-${filePath}`, dataToWrite, 'utf-8')
        }

        console.log(`Competitions: Successfully written ${urls.length} urls to files.`)
    }

    async writeUrlsOfListsOfMatchesToFile(filePath: string): Promise<void> {
        console.log('Competitions: Starting to get urls of lists of matches from competitions.')

        const competitions = await this.competitionRepository.find()
        if (competitions.length <= 0) {
            console.log(
                'Competitions: No competitions to get match lists. Need to scrape competitions first.',
            )
            return
        }

        const urls = competitions.map(({ facrUuid }) => {
            return `${this.facrCompetitionsUrl}${CompetitionService.COMPETITION_MATCHES_PAGE_PATH_PREFIX}/${facrUuid}`
        })
        const chunks = chunk(urls, 100)

        for (const [i, chunk] of chunks.entries()) {
            const dataToWrite = chunk.reduce((dataToWrite: string, url: string) => {
                dataToWrite += url + '\n'
                return dataToWrite
            }, '')

            writeFileSync(`${i}-${filePath}`, dataToWrite, 'utf-8')
        }

        console.log(`Competitions: Successfully written ${urls.length} urls to files.`)
    }

    async getCompetitionHasSeason(competition: Competition, season: Season) {
        const find = await this.competitionHasSeasonRepository.findByCompetitionAndSeason(
            competition,
            season,
        )

        return (
            find ??
            (await this.competitionHasSeasonRepository.save({
                competition,
                season,
            }))
        )
    }
}
