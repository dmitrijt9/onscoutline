import { AppConfig } from '../../../dependency/config/index'
import { Club } from '../../../entities/Club'
import { ClubResponse } from '../object-types/club-response'

export const toClubResponse = (
    { id, name, facrId, facrUuid }: Club,
    config: AppConfig,
): ClubResponse => {
    return {
        id,
        facrId,
        name,
        url: `${config.facrScraper.clubDetailUrl}${facrUuid}`,
    }
}
