import { GraphqlContext } from '../types'
import { toClubResponse } from './mappings/to-club-response'
import { ClubResponse } from './object-types/club-response'
import { Ctx, Query, Resolver } from 'type-graphql'

@Resolver()
export class ClubResolver {
    @Query(() => [ClubResponse])
    async clubs(
        @Ctx()
        { container }: GraphqlContext,
    ): Promise<ClubResponse[]> {
        const allClubs = await container.clubRepository.find()
        return allClubs.map((club) => toClubResponse(club, container.config))
    }
}
