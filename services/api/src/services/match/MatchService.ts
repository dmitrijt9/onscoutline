import { Club } from '../../entities/Club'
import { FailedNewMatchRequestStatus } from '../../entities/FailedNewMatchRequest'
import { Match } from '../../entities/Match'
import { ClubRepository } from '../../repositories/club/ClubRepository'
import { CompetitionRepository } from '../../repositories/competition/CompetitionRepository'
import { FailedNewMatchRequestRepository } from '../../repositories/match/FailedNewMatchRequestRepository'
import { MatchRepository } from '../../repositories/match/MatchRepository'
import { PlayerInClubRepository } from '../../repositories/player/PlayerInClubRepository'
import { toOnscoutlineDateFormat } from '../../utils/conversions'
import { isNil } from '../../utils/index'
import { CompetitionService } from '../competition/CompetitionService'
import { ILogger } from '../logger/ILogger'
import { PlayerService } from '../player/PlayerService'
import { SeasonService } from '../season/SeasonService'
import { MatchClubNotFound, UnexpectedMatchServiceError } from './errors'
import { MatchPlayerRequest, NewMatchRequest, PlayerWithMatchInfo } from './types'

export class MatchService {
    constructor(
        private readonly seasonService: SeasonService,
        private readonly competitionRepository: CompetitionRepository,
        private readonly competitionService: CompetitionService,
        private readonly clubRepository: ClubRepository,
        private readonly playerInClubRepository: PlayerInClubRepository,
        private readonly playerService: PlayerService,
        private readonly matchRepository: MatchRepository,
        private readonly failedNewMatchRequestRepository: FailedNewMatchRequestRepository,
        private readonly logger: ILogger,
    ) {}

    async createMatches(
        newMatchRequests: NewMatchRequest[],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ): Promise<{ matches: Match[]; errors: any[] }> {
        const newMatches: Match[] = []
        const errors: Error[] = []
        for (const newMatchRequest of newMatchRequests) {
            try {
                const match = await this.createMatch(newMatchRequest)
                newMatches.push(match)
            } catch (e) {
                if (e instanceof MatchClubNotFound) {
                    await this.failedNewMatchRequestRepository.save({
                        status: FailedNewMatchRequestStatus.UnprocessedClub,
                        requestJson: newMatchRequest,
                        matchFacrUuid: newMatchRequest.facrUuid,
                    })
                } else if (e.errno !== 1062) {
                    await this.failedNewMatchRequestRepository.save({
                        status: FailedNewMatchRequestStatus.Unprocessed,
                        requestJson: newMatchRequest,
                        matchFacrUuid: newMatchRequest.facrUuid,
                    })
                }

                errors.push(e)
                continue
            }
        }

        this.logger.info(
            `Successfully created ${newMatches.length}/${newMatchRequests.length} new matches.`,
        )

        return { matches: newMatches, errors }
    }

    private async createMatch(newMatchRequest: NewMatchRequest): Promise<Match> {
        const matchSeason = await this.seasonService.getSeasonByDate(
            toOnscoutlineDateFormat(new Date(newMatchRequest.takePlace)),
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

        const matchToSave: Omit<Match, 'id'> = {
            awayTeam: awayClub,
            homeTeam: homeClub,
            // * some matches does not have results...since I do not care about team results, 0 fallback is not problem for me
            scoreAway: newMatchRequest.awayTeamScore ?? 0,
            scoreHome: newMatchRequest.homeTeamScore ?? 0,
            when: newMatchRequest.takePlace,
            competitionSeason: competitionHasSeason,
            facrUuid: newMatchRequest.facrUuid,
        }

        // fails on duplicate match save
        const match = await this.matchRepository.save(matchToSave)

        const homePlayers = await this.getMatchPlayers(
            newMatchRequest.lineups.home,
            homeClub,
            match,
        )
        const awayPlayers = await this.getMatchPlayers(
            newMatchRequest.lineups.away,
            awayClub,
            match,
        )

        const missingPlayers = [...newMatchRequest.lineups.home, ...newMatchRequest.lineups.away]
            .map((pr) => pr.fullname)
            .filter(
                (pr) =>
                    ![...homePlayers, ...awayPlayers]
                        .map((player) => `${player.surname} ${player.name}`)
                        .includes(pr),
            )

        if (missingPlayers.length > 0) {
            await this.failedNewMatchRequestRepository.save({
                status: FailedNewMatchRequestStatus.UnprocessedPlayer,
                requestJson: newMatchRequest,
                matchFacrUuid: newMatchRequest.facrUuid,
            })
        }

        // do not resolves player in match if save of a match above fails
        await this.playerService.resolvePlayersInMatch([...homePlayers, ...awayPlayers], match)

        return match
    }

    private async getMatchPlayers(
        playerRequests: MatchPlayerRequest[],
        clubOfPlayers: Club,
        match: Match,
    ): Promise<PlayerWithMatchInfo[]> {
        const playerRequestByFullnameMap: Map<string, MatchPlayerRequest> = playerRequests.reduce(
            (map, playerReq) => {
                map.set(playerReq.fullname, playerReq)

                return map
            },
            new Map(),
        )
        const foundPlayersInDb = await this.playerInClubRepository.findAllByPlayerFullnameAndClub(
            playerRequests.map((player) => player.fullname),
            clubOfPlayers,
            toOnscoutlineDateFormat(new Date(match.when)),
        )

        return foundPlayersInDb.map(({ player }) => {
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
