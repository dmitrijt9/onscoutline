import { ArgsType, Field } from 'type-graphql'

@ArgsType()
export class PlayerStatsArgs {
    @Field({ nullable: true, description: 'Season for which calculate stats. E.g. 2021/2022' })
    season?: string
}
