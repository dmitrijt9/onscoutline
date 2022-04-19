import { Club } from '../../entities/Club'
import { Competition } from '../../entities/Competition'
import { NewMatchRequest } from '../match/types'
import { HTMLElement } from 'node-html-parser'

export interface IScraper {
    getParsedPage(url: string): Promise<HTMLElement>
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

export type ScrapedPlayer = {
    name: string
    surname: string
    dateOfBirth: string
    facrId: string
    transfers: {
        when: string
        event: string
        from: string
        to: string | null
    }[]
}
