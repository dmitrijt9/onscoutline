import { Gender } from '../../../entities/Player'
import { ISO8601_NoTime } from '../../../entities/types'
import { Field, Int, ObjectType } from 'type-graphql'

@ObjectType()
export class PersonInfo {
    @Field()
    name: string

    @Field()
    surname: string

    @Field(() => String, { nullable: true })
    dateOfBirth?: ISO8601_NoTime

    @Field({ nullable: true })
    gender?: Gender

    @Field({ nullable: true })
    country?: string

    @Field(() => String, { nullable: true })
    facrMemberFrom?: ISO8601_NoTime

    @Field(() => Int, { nullable: true })
    age?: number

    @Field(() => String)
    fullname?: string
}
