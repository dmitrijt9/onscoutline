import { ISO8601_NoTime } from '../../../entities/types'
import { Field, ObjectType } from 'type-graphql'

@ObjectType()
export class TransferPeriod {
    @Field(() => String)
    from: ISO8601_NoTime

    @Field(() => String)
    to: ISO8601_NoTime
}
