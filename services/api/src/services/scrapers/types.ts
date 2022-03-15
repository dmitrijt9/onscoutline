import { HTMLElement } from 'node-html-parser'
import { Club } from '../../entities/Club'
import { Competition } from '../../entities/Competition'
import { Player } from '../../entities/Player'
import { ISO8601 } from '../../entities/types'
import { NewMatchRequest } from '../match/types'

export interface IScraper {
    getParsedPage(url: string): Promise<HTMLElement>
}

export interface IFacrScraper {
    scrapeAndSaveCompetitions(): Promise<Competition[] | undefined>
    saveClubListUrlsToFile(filePath: string): Promise<void>
    scrapeAndSaveClubs(dirname: string): Promise<Club[] | undefined>
    scrapeAndSavePlayersOfAllClubs(): Promise<void>
    scrapeAndSavePlayersOfAClub(clubFacrId: Club['facrId']): Promise<void>
    saveMatchesListUrlsToFile(filePath: string): Promise<void>
    scrapeMatches(htmlsToScrape: string[]): Promise<NewMatchRequest[]>
}

export type ScrapedClub = Omit<Club, 'id'>

export type ScrapedCompetition = Omit<Competition, 'id'>

export type ScrapedPlayer = Omit<Player, 'id'> & {
    playingFrom: ISO8601
}

export type PlayerToUpdate = Player & ScrapedPlayer

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
