import { ArgsType, Field, ID } from 'type-graphql'

@ArgsType()
export class PlayerByIdArgs {
    @Field(() => ID)
    id: number
}
