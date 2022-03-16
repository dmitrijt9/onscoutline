import { HTMLElement } from 'node-html-parser'
import { Club } from '../../entities/Club'
import { Competition } from '../../entities/Competition'
import { Player } from '../../entities/Player'
import { ISO8601 } from '../../entities/types'
import { NewClubRequest } from '../club/types'
import { NewCompetitionRequest } from '../competition/types'
import { NewMatchRequest } from '../match/types'

export interface IScraper {
    getParsedPage(url: string): Promise<HTMLElement>
}

export interface IFacrScraper {
    scrapeCompetitions(): Promise<NewCompetitionRequest[]>
    scrapeClubs(dirname: string): Promise<NewClubRequest[]>
    scrapeAndSavePlayersOfAllClubs(): Promise<void>
    scrapeAndSavePlayersOfAClub(clubFacrId: Club['facrId']): Promise<void>
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
