import { ArgsType, Field } from 'type-graphql'

@ArgsType()
export class PlayersByQueryArgs {
    @Field()
    query: string
}
