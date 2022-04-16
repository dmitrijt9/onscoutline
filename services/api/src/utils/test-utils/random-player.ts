import { randomUUID } from 'crypto'
import { Player } from '../../entities/Player'
import { faker } from '@faker-js/faker'
import { toOnscoutlineDateFormat } from '../conversions'

export const randomTestPlayer = (): Omit<Player, 'id'> => {
    return {
        facrId: randomUUID(),
        name: faker.name.firstName(),
        surname: faker.name.lastName(),
        yearOfBirth: faker.date.past(35).getUTCFullYear().toString(),
        facrMemberFrom: toOnscoutlineDateFormat(faker.date.past(20)),
    }
}
