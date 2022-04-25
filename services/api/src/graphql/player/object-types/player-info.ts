import { ISO8601_NoTime } from '../../../entities/types'
import { TransferRecord } from './transfer-record'
import { Field, Int, ObjectType } from 'type-graphql'

@ObjectType()
export class PlayerInfo {
    @Field(() => Int, { nullable: true })
    shirt?: number

    @Field(() => [String], { nullable: true })
    positions?: string[]

    @Field(() => String, { nullable: true })
    facrMemberFrom?: ISO8601_NoTime

    @Field(() => [TransferRecord], { nullable: true })
    transferRecords?: TransferRecord[]
}
