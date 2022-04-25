import { AppConfig } from '../../dependency/config/index'
import { NewMatchRequest } from '../match/types'
import chunk from '../utils/chunk'
import { fromFacrDateTime } from '../../utils/conversions'
import { AbstractScraper } from './AbstractScraper'
import { FACRScraperElementNotFoundError } from './errors'
import { ScrapedMatchOverview } from './types'
import { HTMLElement } from 'node-html-parser'

export class FacrMatchesScraper extends AbstractScraper {
    private facrCompetitionsUrl: string

    // format of the competitions path is -> `${COMPETITION_X_PAGE_PATH_PREFIX}/[UUID]`
    private static readonly MATCH_DETAIL_PAGE_PATH_PREFIX = '/zapasy/zapas'

    constructor({ facrScraper }: AppConfig) {
        super()
        this.facrCompetitionsUrl = facrScraper.facrCompetitionsUrl
    }

    async scrapeMatches(htmlsToScrape: string[]): Promise<NewMatchRequest[]> {
        console.time('scrapeMatches')
        console.info(
            `FACR Scraper: Start to scrape matches from HTML files ${htmlsToScrape.length}.`,
        )
        let totalMatchesToScrape = 0
        const scrapedMatchOverviews: ScrapedMatchOverview[] = htmlsToScrape
            .map((htmlToScrape) => {
                const parsedHtml = this.parseHtml(htmlToScrape)
                const matchRows = parsedHtml.querySelectorAll('.match-meta .row')

                return matchRows.map((matchRow) => {
                    const linkElement = matchRow.querySelector('div:nth-child(2) a')
                    if (!linkElement) {
                        return undefined
                    }

                    totalMatchesToScrape++

                    const url = linkElement.getAttribute('href')
                    if (!url) {
                        throw new FACRScraperElementNotFoundError('url', 'matches', 'href')
                    }
                    const facrUuid = url.split('/').slice(-1).pop()

                    const takePlace = matchRow.querySelector('div:nth-child(1)')?.innerText
                    if (!takePlace) {
                        throw new FACRScraperElementNotFoundError(
                            'takePlace',
                            'matches',
                            'div:nth-child(1)',
                        )
                    }

                    return {
                        facrUuid,
                        takePlace: takePlace.trim(),
                    }
                })
            })
            .flat()
            .filter(
                (scrapedMatchOverview): scrapedMatchOverview is ScrapedMatchOverview =>
                    !!scrapedMatchOverview,
            )

        const chunks = chunk(scrapedMatchOverviews, 5)
        const scrapedMatches: NewMatchRequest[] = []
        for (const chunk of chunks) {
            const scrapePromises = chunk.map(
                async (matchOverview) => await this.scrapeMatchDetailPage(matchOverview),
            )
            const scraped = (await Promise.all(scrapePromises)).filter(
                (scrapedMatch): scrapedMatch is NewMatchRequest => !!scrapedMatch,
            )

            scrapedMatches.push(...scraped)
        }

        console.timeEnd('scrapeMatches')
        console.info(
            `FACR Scraper: Successfully scraped ${scrapedMatches.length} matches from total ${totalMatchesToScrape} matches to scrape.`,
        )
        return scrapedMatches
    }

    private async scrapeMatchDetailPage(
        matchOverview: ScrapedMatchOverview,
    ): Promise<NewMatchRequest | undefined> {
        console.info(`FACR Scraper: Start to scrape a match: ${matchOverview.facrUuid}`)
        const { facrUuid, takePlace } = matchOverview
        let matchDetailHtml: HTMLElement | null = null
        const url = `${this.facrCompetitionsUrl}${FacrMatchesScraper.MATCH_DETAIL_PAGE_PATH_PREFIX}/${facrUuid}`
        try {
            matchDetailHtml = await this.getParsedPage(url)
        } catch (e) {
            console.warn(
                `FACR Scraper: Could not get parsed match detail page: ${url}. Skipping to the next match.`,
                e,
            )
            return
        }

        const competitionName = matchDetailHtml.querySelector('.container-content h1.h2')?.innerText
        if (!competitionName) {
            throw new FACRScraperElementNotFoundError(
                'competitionName',
                'matches',
                '.container-content h1.h2',
            )
        }

        const homeTeam = matchDetailHtml.querySelector(
            'h2.h2 .row div:nth-child(1) span',
        )?.innerText
        if (!homeTeam) {
            throw new FACRScraperElementNotFoundError(
                'homeTeam',
                'matches',
                'h2.h2 .row div:nth-child(1) span',
            )
        }

        const awayTeam = matchDetailHtml.querySelector(
            'h2.h2 .row div:nth-child(3) span',
        )?.innerText
        if (!awayTeam) {
            throw new FACRScraperElementNotFoundError(
                'awayTeam',
                'matches',
                'h2.h2 .row div:nth-child(3) span',
            )
        }

        let score: string | null = null
        const scoreContainer = matchDetailHtml.querySelector(
            'h2.h2 .row div:nth-child(2)',
        )?.innerText
        if (scoreContainer?.trim() !== '') {
            const scrapedScore = matchDetailHtml.querySelector(
                'h2.h2 .row div:nth-child(2) p.h2',
            )?.innerText
            if (!scrapedScore) {
                throw new FACRScraperElementNotFoundError(
                    'score',
                    `matches ${url}`,
                    'h2.h2 .row div:nth-child(2) p.h2',
                )
            }

            score = scrapedScore
        }

        let homeTeamScore: number | null = null
        let awayTeamScore: number | null = null
        if (score) {
            const [hScore, aScore] = score.split(':')
            homeTeamScore = parseInt(hScore)
            awayTeamScore = parseInt(aScore)
        }

        const homeTeamLineupRows = matchDetailHtml.querySelectorAll(
            '.container-content > div.row:last-of-type div:nth-child(1) table.table tbody:nth-child(2) tr',
        )

        const homeTeamSubstitutesRows = matchDetailHtml.querySelectorAll(
            '.container-content > div.row:last-of-type div:nth-child(1) table.table tbody:nth-child(4) tr',
        )

        const awayTeamLineupRows = matchDetailHtml.querySelectorAll(
            '.container-content > div.row:last-of-type div:nth-child(2) table.table tbody:nth-child(2) tr',
        )

        const awayTeamSubstitutesRows = matchDetailHtml.querySelectorAll(
            '.container-content > div.row:last-of-type div:nth-child(2) table.table tbody:nth-child(4) tr',
        )

        const homeTeamMatchLineup = this.scrapeMatchTeamLineup(
            homeTeamLineupRows,
            homeTeamSubstitutesRows,
        )

        const awayTeamMatchLineup = this.scrapeMatchTeamLineup(
            awayTeamLineupRows,
            awayTeamSubstitutesRows,
        )

        const goalscorersRows = matchDetailHtml.querySelectorAll(
            '.container-content>table.table tbody tr',
        )

        const goalScorers = this.scrapeGoalscorers(goalscorersRows)
        const homeTeamGoalscorers = goalScorers.filter((goalscorer) => goalscorer.team === homeTeam)
        const awayTeamGoalscorers = goalScorers.filter((goalscorer) => goalscorer.team === awayTeam)

        return {
            competition: competitionName,
            facrUuid,
            takePlace: fromFacrDateTime(takePlace),
            homeTeamScore,
            awayTeamScore,
            homeTeam,
            awayTeam,
            lineups: {
                home: homeTeamMatchLineup.map((matchPlayer) => {
                    return {
                        ...matchPlayer,
                        goals: homeTeamGoalscorers
                            .filter(
                                (homeGoalscorer) => homeGoalscorer.player === matchPlayer.fullname,
                            )
                            .map((goalScorer) => {
                                return {
                                    minute: goalScorer.minute,
                                    type: goalScorer.type,
                                }
                            }),
                        side: 'home',
                    }
                }),
                away: awayTeamMatchLineup.map((matchPlayer) => {
                    return {
                        ...matchPlayer,
                        goals: awayTeamGoalscorers
                            .filter(
                                (awayGoalscorer) => awayGoalscorer.player === matchPlayer.fullname,
                            )
                            .map((goalScorer) => {
                                return {
                                    minute: goalScorer.minute,
                                    type: goalScorer.type,
                                }
                            }),
                        side: 'away',
                    }
                }),
            },
        }
    }

    private scrapeMatchTeamLineup(lineupRows: HTMLElement[], substituteRows: HTMLElement[]) {
        const lineup = lineupRows.map((row) => {
            const shirt = row.querySelector('td:nth-child(1)')?.innerText?.trim()
            if (shirt === undefined) {
                throw new FACRScraperElementNotFoundError('shirt', 'matches', 'td:nth-child(1)')
            }

            const position = row.querySelector('td:nth-child(2) span')?.getAttribute('title')
            if (position === undefined) {
                throw new FACRScraperElementNotFoundError('position', 'matches', 'td:nth-child(2)')
            }

            const fullname = row.querySelector('td:nth-child(3)')?.innerText?.trim()
            if (fullname === undefined) {
                throw new FACRScraperElementNotFoundError('fullname', 'matches', 'td:nth-child(3)')
            }
            const yellowCard = row.querySelector('td:nth-child(4)')?.innerText?.trim()
            if (yellowCard === undefined) {
                throw new FACRScraperElementNotFoundError(
                    'yellowCard',
                    'matches',
                    'td:nth-child(4)',
                )
            }
            const redCard = row.querySelector('td:nth-child(5)')?.innerText?.trim()
            if (redCard === undefined) {
                throw new FACRScraperElementNotFoundError('redCard', 'matches', 'td:nth-child(5)')
            }
            const substitution = row.querySelector('td:nth-child(6)')?.innerText?.trim()
            if (substitution === undefined) {
                throw new FACRScraperElementNotFoundError(
                    'substitution',
                    'matches',
                    'td:nth-child(6)',
                )
            }

            const yellowCardParsed = yellowCard.split(', ')
            return {
                shirt: shirt !== '' ? parseInt(shirt) : 0,
                position,
                // * Remove "Captain" flag.
                fullname: fullname.replace(' [K]', ''),
                yellowCardMinutes:
                    yellowCardParsed.length === 1 && yellowCardParsed[0] === ''
                        ? null
                        : yellowCardParsed.map((yc) => +yc),
                redCardMinute: redCard !== '' ? +redCard : null,
                substitution: substitution === '' ? null : substitution,
                isInStartingLineup: true,
            }
        })

        const substitutes = substituteRows.map((row) => {
            const shirt = row.querySelector('td:nth-child(1)')?.innerText?.trim()
            if (shirt === undefined) {
                throw new FACRScraperElementNotFoundError('shirt', 'matches', 'td:nth-child(1)')
            }

            const position = row.querySelector('td:nth-child(2) span')?.getAttribute('title')
            if (position === undefined) {
                throw new FACRScraperElementNotFoundError('position', 'matches', 'td:nth-child(2)')
            }

            const fullname = row.querySelector('td:nth-child(3)')?.innerText?.trim()
            if (fullname === undefined) {
                throw new FACRScraperElementNotFoundError('fullname', 'matches', 'td:nth-child(3)')
            }
            const yellowCard = row.querySelector('td:nth-child(4)')?.innerText?.trim()
            if (yellowCard === undefined) {
                throw new FACRScraperElementNotFoundError(
                    'yellowCard',
                    'matches',
                    'td:nth-child(4)',
                )
            }
            const redCard = row.querySelector('td:nth-child(5)')?.innerText?.trim()
            if (redCard === undefined) {
                throw new FACRScraperElementNotFoundError('redCard', 'matches', 'td:nth-child(5)')
            }
            const substitution = row.querySelector('td:nth-child(6)')?.innerText?.trim()
            if (substitution === undefined) {
                throw new FACRScraperElementNotFoundError(
                    'substitution',
                    'matches',
                    'td:nth-child(6)',
                )
            }

            const yellowCardParsed = yellowCard.split(', ')
            return {
                shirt: shirt !== '' ? parseInt(shirt) : 0,
                position,
                fullname,
                yellowCardMinutes:
                    yellowCardParsed.length === 1 && yellowCardParsed[0] === ''
                        ? null
                        : yellowCardParsed.map((yc) => +yc),
                redCardMinute: redCard !== '' ? +redCard : null,
                substitution: substitution === '' ? null : substitution,
                isInStartingLineup: false,
            }
        })

        return [...lineup, ...substitutes]
    }

    private scrapeGoalscorers(goalScorerRows: HTMLElement[]) {
        return goalScorerRows.map((row) => {
            const team = row.querySelector('td:nth-child(1)')?.innerText?.trim()
            if (team === undefined) {
                throw new FACRScraperElementNotFoundError('team', 'matches', 'td:nth-child(1)')
            }
            const player = row.querySelector('td:nth-child(2)')?.innerText?.trim()
            if (player === undefined) {
                throw new FACRScraperElementNotFoundError('player', 'matches', 'td:nth-child(2)')
            }
            const type = row.querySelector('td:nth-child(3)')?.innerText?.trim()
            if (type === undefined) {
                throw new FACRScraperElementNotFoundError('type', 'matches', 'td:nth-child(3)')
            }
            const minute = row.querySelector('td:nth-child(4)')?.innerText?.trim()
            if (minute === undefined) {
                throw new FACRScraperElementNotFoundError('minute', 'matches', 'td:nth-child(4)')
            }

            return {
                team,
                player,
                type,
                minute: minute !== '' ? parseInt(minute) : 0,
            }
        })
    }
}
