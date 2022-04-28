import { isNil } from '../../../utils/index'
import { toClubResponse } from '../../club/mappings/to-club-response'
import { ClubResponse } from '../../club/object-types/club-response'
import { PlayerStats } from '../../stats/object-types/player-stats'
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

        const playedMatches = await container.playerInMatchRepository.findPlayedMatchesCount(
            player.id,
            season,
        )

        const {
            yellowCards,
            redCards,
            concededGoals,
            ownGoals,
            penaltyGoals,
            regularGoals,
            hattricks,
        } = await container.playerGameStatisticsRepository.findAllStatTypesSum(player.id, season)

        const cleanSheets = await container.playerGameStatisticsRepository.findCleanSheetsCount(
            player.id,
            season,
        )

        const scoredGoals = penaltyGoals + regularGoals
        const gpg = playedMatches === 0 ? 0 : scoredGoals / playedMatches
        const goalsPerGameRatio = Math.round((gpg + Number.EPSILON) * 100) / 100

        return {
            startingEleven,
            scoredGoals,
            ownGoals,
            penaltyGoals,
            concededGoals,
            cleanSheets,
            playedMatches,
            goalsPerGameRatio,
            yellowCards,
            redCards,
            hattricks,
        }
    }
}
