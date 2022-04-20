import { randomUUID } from 'crypto'
import { Player } from '../../entities/Player'
import { toOnscoutlineDateFormat } from '../conversions'
import { faker } from '@faker-js/faker'

export const randomTestPlayer = (): Omit<Player, 'id'> => {
    return {
        facrId: randomUUID(),
        name: faker.name.firstName(),
        surname: faker.name.lastName(),
        dateOfBirth: toOnscoutlineDateFormat(faker.date.past(35)),
        facrMemberFrom: toOnscoutlineDateFormat(faker.date.past(20)),
    }
}
