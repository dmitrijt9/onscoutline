import { isNil } from '../../../utils/index'
import { toClubResponse } from '../../club/mappings/to-club-response'
import { ClubResponse } from '../../club/object-types/club-response'
import { PlayerStats } from '../../playerStats/object-types/player-stats'
import { GraphqlContext } from '../../types'
import { PlayerStatsArgs } from '../input-types/player-stats'
import { Player } from '../object-types/player'
import { MoreThanOrEqual } from 'typeorm'
import { Args, Ctx, FieldResolver, Resolver, Root } from 'type-graphql'

@Resolver(() => Player)
export class PlayerFieldResolvers {
    @FieldResolver(() => ClubResponse, { nullable: true })
    async parentClub(
        @Root() player: Player,
        @Ctx() { container }: GraphqlContext,
    ): Promise<ClubResponse | null> {
        const relation = await container.playerInClubRepository.findOne({
            relations: ['club'],
            where: {
                player: player.id,
                isOnLoan: false,
            },
            order: {
                playingFrom: 'DESC',
            },
        })

        if (isNil(relation)) {
            return null
        }

        return toClubResponse(relation.club, container.config)
    }

    @FieldResolver(() => ClubResponse, { nullable: true })
    async loanClub(
        @Root() player: Player,
        @Ctx() { container }: GraphqlContext,
    ): Promise<ClubResponse | null> {
        const relation = await container.playerInClubRepository.findOne({
            relations: ['club'],
            where: {
                player: player.id,
                isOnLoan: true,
                playingUntil: MoreThanOrEqual(new Date()),
            },
        })

        if (isNil(relation)) {
            return null
        }

        return toClubResponse(relation.club, container.config)
    }

    @FieldResolver(() => PlayerStats)
    async stats(
        @Root() player: Player,
        @Args() { season }: PlayerStatsArgs,
        @Ctx() { container }: GraphqlContext,
    ): Promise<PlayerStats> {
        const startingEleven = await container.playerInMatchRepository.findStartingElevenCount(
            player.id,
            season,
        )

        const playedMatchesCount = await container.playerInMatchRepository.findPlayedMatchesCount(
            player.id,
            season,
        )

        const { yellowCards, redCards, concededGoals, ownGoals, penaltyGoals, regularGoals } =
            await container.playerGameStatisticsRepository.findAllStatTypesSum(player.id, season)

        const cleanSheetsCount =
            await container.playerGameStatisticsRepository.findCleanSheetsCount(player.id, season)

        const gpg = (penaltyGoals + regularGoals) / playedMatchesCount
        const goalsPerGameRatio = Math.round((gpg + Number.EPSILON) * 100) / 100

        return {
            startingElevenCount: startingEleven,
            scoredGoalsSum: regularGoals + penaltyGoals,
            ownGoalsSum: ownGoals,
            penaltyGoalsSum: penaltyGoals,
            concededGoalsSum: concededGoals,
            cleanSheetsCount,
            playedMatchesCount,
            goalsPerGameRatio,
            yellowCardsSum: yellowCards,
            redCardsSum: redCards,
        }
    }
}
