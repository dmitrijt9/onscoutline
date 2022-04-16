import { randomUUID } from 'crypto'
import { faker } from '@faker-js/faker'
import { Club } from '../../entities/Club'

export const randomTestClub = (clubname?: string): Omit<Club, 'id'> => {
    return {
        facrId: randomUUID(),
        name: clubname ?? faker.name.firstName('female'),
        facrUuid: randomUUID(),
    }
}
