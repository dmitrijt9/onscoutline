import { PlayerStatBySeason } from '../input-types/player-stat-by-season'
import { StatBySeason } from '../object-types/stat-by-season'
import { PlayerNotFound } from '../../player/errors'
import { GraphqlContext } from '../../types'
import { Args, Ctx, Query, Resolver } from 'type-graphql'

@Resolver()
export class StatResolver {
    @Query(() => [StatBySeason])
    async playerStats(
        @Args()
        { playerId, stat }: PlayerStatBySeason,
        @Ctx()
        { container }: GraphqlContext,
    ): Promise<StatBySeason[]> {
        const player = await container.playerRepository.findOne(playerId)
        if (!player) {
            throw new PlayerNotFound(playerId)
        }
        return await container.playerGameStatisticsRepository.findStatSumForAllSeasons(
            playerId,
            stat,
        )
    }
}
