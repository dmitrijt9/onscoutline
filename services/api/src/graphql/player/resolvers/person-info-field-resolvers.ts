import { isNil } from '../../../utils/index'
import { PersonInfo } from '../object-types/person-info'
import { FieldResolver, Int, Resolver, Root } from 'type-graphql'

@Resolver(() => PersonInfo)
export class PersonInfoFieldResolvers {
    @FieldResolver(() => Int, { nullable: true })
    age(@Root() personInfo: PersonInfo): number | null {
        if (isNil(personInfo.dateOfBirth)) {
            return null
        }
        const today = new Date()
        const birthDate = new Date(personInfo.dateOfBirth)
        let age = today.getFullYear() - birthDate.getFullYear()
        const m = today.getMonth() - birthDate.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--
        }
        return age
    }

    @FieldResolver(() => String)
    fullname(@Root() personInfo: PersonInfo) {
        return `${personInfo.name} ${personInfo.surname}`
    }
}
