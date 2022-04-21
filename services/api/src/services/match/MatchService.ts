import { FailedNewMatchRequestStatus } from '../../entities/FailedNewMatchRequest'
import { Match } from '../../entities/Match'
import { ClubRepository } from '../../repositories/club/ClubRepository'
import { CompetitionRepository } from '../../repositories/competition/CompetitionRepository'
import { FailedNewMatchRequestRepository } from '../../repositories/match/FailedNewMatchRequestRepository'
import { MatchRepository } from '../../repositories/match/MatchRepository'
import { PlayerRepository } from '../../repositories/player/PlayerRepository'
import { fromFacrDateTime, toOnscoutlineDateFormat } from '../../utils/conversions'
import { isNil } from '../../utils/index'
import { CompetitionService } from '../competition/CompetitionService'
import { ILogger } from '../logger/ILogger'
import { PlayerService } from '../player/PlayerService'
import { SeasonService } from '../season/SeasonService'
import { MatchClubNotFound, MatchPlayerNotFound, UnexpectedMatchServiceError } from './errors'
import { MatchPlayerRequest, NewMatchRequest, PlayerWithMatchInfo } from './types'

export class MatchService {
    constructor(
        private readonly seasonService: SeasonService,
        private readonly competitionRepository: CompetitionRepository,
        private readonly competitionService: CompetitionService,
        private readonly clubRepository: ClubRepository,
        private readonly playerRepository: PlayerRepository,
        private readonly playerService: PlayerService,
        private readonly matchRepository: MatchRepository,
        private readonly failedNewMatchRequestRepository: FailedNewMatchRequestRepository,
        private readonly logger: ILogger,
    ) {}

    async createMatches(
        newMatchRequest: NewMatchRequest[],
    ): Promise<PromiseSettledResult<Match>[]> {
        const results = await Promise.allSettled(
            newMatchRequest.map(async (newMatchRequest) => {
                try {
                    return await this.createMatch(newMatchRequest)
                } catch (e) {
                    if (e instanceof MatchClubNotFound) {
                        await this.failedNewMatchRequestRepository.save({
                            status: FailedNewMatchRequestStatus.UnprocessedClub,
                            requestJson: newMatchRequest,
                        })
                    } else if (e instanceof MatchPlayerNotFound) {
                        await this.failedNewMatchRequestRepository.save({
                            status: FailedNewMatchRequestStatus.UnprocessedPlayer,
                            requestJson: newMatchRequest,
                        })
                    } else {
                        await this.failedNewMatchRequestRepository.save({
                            status: FailedNewMatchRequestStatus.Unprocessed,
                            requestJson: newMatchRequest,
                        })
                    }

                    throw e
                }
            }),
        )

        results.forEach((result) => {
            if (result.status === 'rejected') {
                this.logger.warn(result.reason)
            }
        })

        const fullfilledResults = results.filter(({ status }) => status === 'fulfilled')

        this.logger.info(
            `Successfully created ${fullfilledResults.length}/${newMatchRequest.length} new matches.`,
        )

        return results
    }

    private async createMatch(newMatchRequest: NewMatchRequest): Promise<Match> {
        const matchTakePlace = fromFacrDateTime(newMatchRequest.takePlace)
        const matchSeason = await this.seasonService.getSeasonByDate(
            toOnscoutlineDateFormat(new Date(fromFacrDateTime(newMatchRequest.takePlace))),
        )

        const competition = await this.competitionRepository.findByName(newMatchRequest.competition)

        if (!competition) {
            throw new UnexpectedMatchServiceError(
                'Could not find competition for this match.',
                newMatchRequest,
            )
        }

        const competitionHasSeason = await this.competitionService.getCompetitionHasSeason(
            competition,
            matchSeason,
        )

        const homeClubName = newMatchRequest.homeTeam
        const awayClubName = newMatchRequest.awayTeam

        const [homeClub, awayClub] = await Promise.all([
            this.clubRepository.findByName(homeClubName),
            this.clubRepository.findByName(awayClubName),
        ])

        if (isNil(homeClub)) {
            throw new MatchClubNotFound(homeClubName, undefined, newMatchRequest)
        }

        if (isNil(awayClub)) {
            throw new MatchClubNotFound(awayClubName, undefined, newMatchRequest)
        }

        const homePlayers = await this.getMatchPlayers(newMatchRequest.lineups.home)
        const awayPlayers = await this.getMatchPlayers(newMatchRequest.lineups.away)

        const matchToSave: Omit<Match, 'id'> = {
            awayTeam: awayClub,
            homeTeam: homeClub,
            // * some matches does not have results...since I do not care about team results, 0 fallback is not problem for me
            scoreAway: newMatchRequest.awayTeamScore ?? 0,
            scoreHome: newMatchRequest.homeTeamScore ?? 0,
            when: matchTakePlace,
            competitionSeason: competitionHasSeason,
        }

        const match = await this.matchRepository.save(matchToSave)

        await this.playerService.resolvePlayersInMatch([...homePlayers, ...awayPlayers], match)

        return match
    }

    private async getMatchPlayers(
        playerRequests: MatchPlayerRequest[],
    ): Promise<PlayerWithMatchInfo[]> {
        const playerRequestByFullnameMap: Map<string, MatchPlayerRequest> = playerRequests.reduce(
            (map, playerReq) => {
                map.set(playerReq.fullname, playerReq)

                return map
            },
            new Map(),
        )
        const foundPlayersInDb = await this.playerRepository.findAllByFullname(
            playerRequests.map((player) => player.fullname),
        )

        if (foundPlayersInDb.length !== playerRequests.length) {
            throw new MatchPlayerNotFound(undefined, { playerRequests, foundPlayersInDb })
        }

        return foundPlayersInDb.map((player) => {
            const found = playerRequestByFullnameMap.get(`${player.surname} ${player.name}`)

            // should not happen
            if (!found) {
                throw new UnexpectedMatchServiceError(
                    'Could not find linked player in a match lineup.',
                    {
                        playerFromDb: player,
                        lineup: playerRequests,
                    },
                )
            }

            return {
                ...player,
                matchInfo: found,
            }
        })
    }
}
