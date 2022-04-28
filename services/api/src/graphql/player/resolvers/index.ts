import { GraphqlContext } from '../../types'
import { PlayerNotFound } from '../errors'
import { PlayerByIdArgs } from '../input-types/player-by-id'
import { toGqlPlayer } from '../mappings/to-gql-player'
import { Player } from '../object-types/player'
import { PlayersByQueryArgs } from '../input-types/players-by-query'
import { Args, Ctx, Query, Resolver } from 'type-graphql'

@Resolver()
export class PlayerResolver {
    @Query(() => Player)
    async player(
        @Args()
        { id }: PlayerByIdArgs,
        @Ctx()
        { container }: GraphqlContext,
    ): Promise<Player> {
        const player = await container.playerRepository.findOne(id)
        if (!player) {
            throw new PlayerNotFound(id)
        }
        return toGqlPlayer(player)
    }

    @Query(() => [Player])
    async players(
        @Args()
        { query }: PlayersByQueryArgs,
        @Ctx()
        { container }: GraphqlContext,
    ) {
        const players = await container.playerRepository.findByQuery(query)
        return players.map(toGqlPlayer)
    }
}
