import { Club } from '../../entities/Club'
import { Competition } from '../../entities/Competition'
import { NewMatchRequest } from '../match/types'
import { ISO8601_NoTime } from '../../entities/types'
import { Gender } from '../../entities/Player'
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

type ScrapedPlayerTransfer = {
    when: string
    event: string
    from: string
    to: string | null
    period: {
        from: string
        to: string
    } | null
}
export type ScrapedPlayer = {
    name: string
    surname: string
    dateOfBirth: string
    facrId: string
    facrMemberFrom: ISO8601_NoTime
    gender: Gender
    country: string
    parentClub: {
        clubFacrId: string
        playingFrom: ISO8601_NoTime
    }
    loanClub: {
        clubFacrId: string
        playingFrom: ISO8601_NoTime
        playingUntil: ISO8601_NoTime
    } | null
    transfers: ScrapedPlayerTransfer[]
}
export type PlayerLinks = { memberInfoPath: string; playerInfoPath: string }
export type ClubPlayersLinks = {
    club: string
    playersLinks: PlayerLinks[]
}

export type ClubScrapedPlayers = {
    club: string
    scrapedPlayers: ScrapedPlayer[]
}
