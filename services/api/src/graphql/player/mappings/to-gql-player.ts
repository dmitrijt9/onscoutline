import { Player as CorePlayer } from '../../../entities/Player'
import { Player } from '../object-types/player'

export const toGqlPlayer = ({
    facrId,
    id,
    country,
    dateOfBirth,
    name,
    surname,
    gender,
    facrMemberFrom,
    positions,
    shirtNumber,
    transferRecords,
}: CorePlayer): Player => {
    return {
        facrId,
        id,
        personInfo: {
            country,
            dateOfBirth,
            name,
            surname,
            gender,
            facrMemberFrom,
        },
        playerInfo: {
            facrMemberFrom,
            positions,
            shirt: shirtNumber,
            transferRecords,
        },
    }
}
