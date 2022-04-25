import { ISO8601_NoTime } from '../../../entities/types'
import { TransferPeriod } from './transfer-period'
import { Field, ObjectType } from 'type-graphql'

@ObjectType()
export class TransferRecord {
    @Field(() => String)
    when: ISO8601_NoTime

    @Field()
    event: string

    @Field()
    clubFrom: string

    @Field(() => String, { nullable: true })
    clubTo: string | null

    @Field(() => TransferPeriod, { nullable: true })
    period: TransferPeriod | null
}
