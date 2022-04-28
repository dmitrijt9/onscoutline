import { Field, Float, Int, ObjectType } from 'type-graphql'

@ObjectType()
export class PlayerStats {
    @Field(() => Int, {
        description:
            'How many times player started in "starting eleven" from beginning of the match',
    })
    startingEleven: number

    @Field(() => Int, {
        description: 'Sum of penalty and regular types of goals',
    })
    scoredGoals: number

    @Field(() => Int, {
        description: 'Sum of own goals',
    })
    ownGoals: number

    @Field(() => Int, {
        description: 'Sum of penalty goals',
    })
    penaltyGoals: number

    @Field(() => Int, { description: 'How many goals the player conceded as a goalkeeper' })
    concededGoals: number

    @Field(() => Int, { description: 'How many clean sheets the goalkeeper has' })
    cleanSheets: number

    @Field(() => Int, { description: 'Total matches played' })
    playedMatches: number

    @Field(() => Float, { description: 'GPG - Goals per game ratio' })
    goalsPerGameRatio: number

    @Field(() => Int)
    yellowCards: number

    @Field(() => Int)
    redCards: number

    @Field(() => Int, {
        description: 'How many times the player scored 3 or more goals in a single match',
    })
    hattricks: number
}
