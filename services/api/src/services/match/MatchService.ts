import { Club } from '../../entities/Club'
import { ClubRepository } from '../../repositories/club/ClubRepository'
import { CompetitionRepository } from '../../repositories/competition/CompetitionRepository'
import { toOnscoutlineDateFormat } from '../../utils/conversions'
import { CompetitionService } from '../competition/CompetitionService'
import { SeasonService } from '../season/SeasonService'
import { NewMatchRequest } from './types'

export class MatchService {
    constructor(
        private readonly seasonService: SeasonService,
        private readonly competitionRepository: CompetitionRepository,
        private readonly competitionService: CompetitionService,
        private readonly clubRepository: ClubRepository,
    ) {}

    async processNewMatches(newMatchRequest: NewMatchRequest[]) {
        await Promise.all(
            newMatchRequest.map((newMatchRequest) => this.createMatch(newMatchRequest)),
        )
        // TODO: business logic
        // TODO: get competition
        // TODO: get season
        // TODO: validate clubs - if exists, if not, create without facrId etc.
        // TODO: validate players - if exists, if not, create without facrId etc.
        // TODO: prepare players - set stats, resolve current club etc.
        // TODO: prepare players stats
        // TODO: save match, player in match, player stats
    }

    private async createMatch(newMatchRequest: NewMatchRequest) {
        const matchSeason = await this.seasonService.getSeasonByDate(
            toOnscoutlineDateFormat(new Date(newMatchRequest.takePlace)),
        )

        const competition = await this.competitionRepository.findByName(newMatchRequest.competition)

        if (!competition) {
            // TODO: Custom error - to pass whole match request payload, so that I can retry to import this match somehow
            throw new Error('Could not find competition for this match.')
        }

        const competitionHasSeason = await this.competitionService.getCompetitionHasSeason(
            competition,
            matchSeason,
        )

        const homeClubName = newMatchRequest.homeTeam
        const awayClubName = newMatchRequest.awayTeam

        const homeClub = await this.getMatchClub(homeClubName)
        const awayClub = await this.getMatchClub(awayClubName)

        console.log(competitionHasSeason, homeClub, awayClub)
    }

    private async getMatchClub(clubName: string): Promise<Club> {
        const clubInDb = await this.clubRepository.findByName(clubName)

        return (
            clubInDb ??
            (await this.clubRepository.save({
                facrId: null,
                facrUuid: null,
                name: clubName,
            }))
        )
    }
}
