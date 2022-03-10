import { addCompetition1645357697040 } from './1645357697040-add-competition'
import { addCompetitionIndexRegionId1645473771998 } from './1645473771998-add-competition-index-regionId'
import { addClub1645535290191 } from './1645535290191-add-club'
import { addPlayerAndPlayerInClubRelation1646472703778 } from './1646472703778-add-player-and-player-in-club-relation'
import { addFacrIDPlayer1646912081829 } from './1646912081829-add-facrID-player'
import { fixPlayerYearOfBirth1646912746976 } from './1646912746976-fix-player-year-of-birth'
import { fixPlayerFacrMemberFrom1646913119806 } from './1646913119806-fix-player-facr-member-from'

export const migrations = [
    addCompetition1645357697040,
    addCompetitionIndexRegionId1645473771998,
    addClub1645535290191,
    addPlayerAndPlayerInClubRelation1646472703778,
    addFacrIDPlayer1646912081829,
    fixPlayerYearOfBirth1646912746976,
    fixPlayerFacrMemberFrom1646913119806,
]
