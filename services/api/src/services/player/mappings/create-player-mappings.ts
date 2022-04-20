import { ScrapedPlayer } from '../../scrapers/types'
import { NewPlayerRequest } from '../types'

export const toNewPlayerRequest = (scrapedPlayer: ScrapedPlayer): NewPlayerRequest => {
    return {
        ...scrapedPlayer,
        transfersRecords: scrapedPlayer.transfers.map((transferRecord) => {
            return {
                event: transferRecord.event,
                clubFrom: transferRecord.from,
                clubTo: transferRecord.to,
                period: transferRecord.period,
                when: transferRecord.when,
            }
        }),
    }
}
