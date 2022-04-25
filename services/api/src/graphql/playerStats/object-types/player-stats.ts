import { Field, Float, Int, ObjectType } from 'type-graphql'

@ObjectType()
export class PlayerStats {
    @Field(() => Int, {
        description:
            'How many times player started in "starting eleven" from beginning of the match',
    })
    startingElevenCount: number

    @Field(() => Int, {
        description: 'Sum of penalty and regular types of goals',
    })
    scoredGoalsSum: number

    @Field(() => Int, {
        description: 'Sum of own goals',
    })
    ownGoalsSum: number

    @Field(() => Int, {
        description: 'Sum of penalty goals',
    })
    penaltyGoalsSum: number

    @Field(() => Int, { description: 'How many goals the player conceded as a goalkeeper' })
    concededGoalsSum: number

    @Field(() => Int, { description: 'How many clean sheets the goalkeeper has' })
    cleanSheetsCount: number

    @Field(() => Int, { description: 'Total matches played' })
    playedMatchesCount: number

    @Field(() => Float, { description: 'GPG - Goals per game ratio' })
    goalsPerGameRatio: number

    @Field(() => Int)
    yellowCardsSum: number

    @Field(() => Int)
    redCardsSum: number
}
