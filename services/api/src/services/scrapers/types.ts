import { HTMLElement } from 'node-html-parser'
import { Club } from '../../entities/Club'
import { Competition } from '../../entities/Competition'
import { NewClubRequest } from '../club/types'
import { NewCompetitionRequest } from '../competition/types'
import { NewMatchRequest } from '../match/types'
import { NewPlayerRequest } from '../player/types'

export interface IScraper {
    getParsedPage(url: string): Promise<HTMLElement>
}

export interface IFacrScraper {
    scrapeCompetitions(): Promise<NewCompetitionRequest[]>
    scrapeClubs(dirname: string): Promise<NewClubRequest[]>
    scrapePlayersOfClubs(clubs: Club[]): Promise<Map<string, NewPlayerRequest[]>>
    scrapeMatches(htmlsToScrape: string[]): Promise<NewMatchRequest[]>
}

export type ScrapedClub = Omit<Club, 'id' | 'facrId' | 'facrUuid'> & {
    facrId: string
    facrUuid: string
}

export type ScrapedCompetition = Omit<Competition, 'id'>

export type TPuppeteerSelector = string | string[]

export type TPuppeteerSelectorOptions = {
    visible?: boolean
    hidden?: boolean
    timeout?: number
}

export type ScrapedMatchOverview = {
    facrUuid: NewMatchRequest['facrUuid']
    takePlace: NewMatchRequest['takePlace']
}
