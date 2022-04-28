import { StatType } from '../entities/PlayerGameStatistic'
import { PlayerStat } from './stats/enums'
import { Gender } from '@faker-js/faker'
import { registerEnumType } from 'type-graphql'

export enum Sort {
    Asc = 'Asc',
    Desc = 'Desc',
}

export const registerEnums = () => {
    registerEnumType(Gender, {
        name: 'Gender',
        description: 'Gender of a person',
    })

    registerEnumType(Sort, {
        name: 'Sort',
        description: 'Sorting options',
    })

    registerEnumType(StatType, {
        name: 'StatType',
        description: 'Player statistics types',
    })

    registerEnumType(PlayerStat, {
        name: 'PlayerStat',
        description: 'Player statistics',
    })
}
