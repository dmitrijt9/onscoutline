import { Field, Float, ObjectType } from 'type-graphql'

@ObjectType()
export class StatBySeason {
    @Field({ description: 'Season the stat is calculated for.' })
    season: string

    @Field(() => Float, {
        description: 'Result value of a calculated stat.',
    })
    value: number
}
