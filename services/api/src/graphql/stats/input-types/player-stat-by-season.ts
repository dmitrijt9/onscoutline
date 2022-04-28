import { StatType } from '../../../entities/PlayerGameStatistic'
import { ArgsType, Field, ID } from 'type-graphql'

@ArgsType()
export class PlayerStatBySeason {
    @Field(() => ID)
    playerId: number

    @Field(() => StatType)
    stat: StatType
}
