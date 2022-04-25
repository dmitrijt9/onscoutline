import { GraphqlContext } from '../types'
import { Ctx, Query, Resolver } from 'type-graphql'

@Resolver()
export class ClubResolver {
    @Query(() => String)
    async clubs(
        @Ctx()
        { container }: GraphqlContext,
    ): Promise<string> {
        const allClubsCount = await container.clubRepository.createQueryBuilder('club').getCount()
        return `Number of clubs in DB: ${allClubsCount}`
    }
}
