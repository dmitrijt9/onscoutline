import { HTMLElement } from 'node-html-parser'

export interface IScraper {
    getParsedPage(url: string): Promise<HTMLElement>
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
