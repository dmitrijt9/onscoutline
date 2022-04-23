import { initDb1650462161746 } from './1650462161746-init-db'
import { addFailedMatchRequest1650536268590 } from './1650536268590-add-failed-match-request'
import { addMatchDedupKey1650542718002 } from './1650542718002-add-match-dedup-key'
import { addMatchFacrUuid1650554984867 } from './1650554984867-add-match-facr-uuid'
import { removeFacridNullable1650618450921 } from './1650618450921-remove-facrid-nullable'
import { addPlayerShirtPositions1650620674939 } from './1650620674939-add-player-shirt-positions'
import { addFailedMatchesComposite1650626688142 } from './1650626688142-add-failed-matches-composite'
import { addPlayerGameStatisticsUqIdx1650750305767 } from './1650750305767-add-player-game-statistics-uq-idx'

export const migrations = [
    initDb1650462161746,
    addFailedMatchRequest1650536268590,
    addMatchDedupKey1650542718002,
    addMatchFacrUuid1650554984867,
    removeFacridNullable1650618450921,
    addPlayerShirtPositions1650620674939,
    addFailedMatchesComposite1650626688142,
    addPlayerGameStatisticsUqIdx1650750305767,
]
