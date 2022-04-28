import { PlayerStat } from '../enums'
import { ArgsType, Field, ID } from 'type-graphql'

@ArgsType()
export class PlayerStatBySeason {
    @Field(() => ID)
    playerId: number

    @Field(() => PlayerStat)
    stat: PlayerStat
}
