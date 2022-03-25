import { addCompetition1645357697040 } from './1645357697040-add-competition'
import { addCompetitionIndexRegionId1645473771998 } from './1645473771998-add-competition-index-regionId'
import { addClub1645535290191 } from './1645535290191-add-club'
import { addPlayerAndPlayerInClubRelation1646472703778 } from './1646472703778-add-player-and-player-in-club-relation'
import { addFacrIDPlayer1646912081829 } from './1646912081829-add-facrID-player'
import { fixPlayerYearOfBirth1646912746976 } from './1646912746976-fix-player-year-of-birth'
import { fixPlayerFacrMemberFrom1646913119806 } from './1646913119806-fix-player-facr-member-from'
import { addMatchAndRelation1647520568926 } from './1647520568926-add-match-and-relation'
import { addSeasonAndRelation1647526770063 } from './1647526770063-add-season-and-relation'
import { addPlayerGameStat1647781826502 } from './1647781826502-add-player-game-stat'
import { addCompetitionToMatch1647957563531 } from './1647957563531-add-competition-to-match'
import { updateUqIndexes1647961286369 } from './1647961286369-update-uq-indexes'
import { removeSeasonType1648240031232 } from './1648240031232-remove-season-type'
import { clubFacrIdNullable1648242740268 } from './1648242740268-club-facr-id-nullable'

export const migrations = [
    addCompetition1645357697040,
    addCompetitionIndexRegionId1645473771998,
    addClub1645535290191,
    addPlayerAndPlayerInClubRelation1646472703778,
    addFacrIDPlayer1646912081829,
    fixPlayerYearOfBirth1646912746976,
    fixPlayerFacrMemberFrom1646913119806,
    addMatchAndRelation1647520568926,
    addSeasonAndRelation1647526770063,
    addPlayerGameStat1647781826502,
    addCompetitionToMatch1647957563531,
    updateUqIndexes1647961286369,
    removeSeasonType1648240031232,
    clubFacrIdNullable1648242740268,
]
