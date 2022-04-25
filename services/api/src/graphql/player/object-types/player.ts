import { PersonInfo } from './person-info'
import { PlayerInfo } from './player-info'
import { Field, ID, ObjectType } from 'type-graphql'

@ObjectType()
export class Player {
    @Field(() => ID)
    id: number

    @Field()
    facrId: string

    @Field(() => PersonInfo)
    personInfo: PersonInfo

    @Field(() => PlayerInfo)
    playerInfo: PlayerInfo
}
