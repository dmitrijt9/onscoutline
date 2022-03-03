import { HTMLElement } from 'node-html-parser'
import { Club } from '../../entities/Club'
import { Competition } from '../../entities/Competition'

export interface IScraper {
    getParsedPage(url: string): Promise<HTMLElement>
}

export interface IFacrScraper {
    scrapeAndSaveCompetitions(): Promise<Competition[] | undefined>
    saveClubListsUrlsToFile(filePath: string): Promise<void>
    scrapeAndSaveClubs(dirname: string): Promise<Club[] | undefined>
}

export interface ScrapedClub {
    name: string
    facrId: string
    facrUuid: string
}

export interface ScrapedCompetition {
    name: string
    regionId: string
    regionName: string
    facrId: string
    facrUuid: string
}
