import { Field, ID, ObjectType } from 'type-graphql'

@ObjectType()
export class ClubResponse {
    @Field(() => ID, { description: 'Unique ID in the API' })
    id: number

    @Field({ description: 'Unique ID of the club in FAČR' })
    facrId: string

    @Field()
    name: string

    @Field({ description: 'URL with a detail of the club in FAČR' })
    url: string
}
