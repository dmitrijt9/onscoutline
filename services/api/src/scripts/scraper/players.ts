import { createContainer } from '../../dependency/container/index'
import { toNewPlayerRequest } from '../../services/player/mappings/create-player-mappings'
import yargs from 'yargs'
import { In } from 'typeorm'

const scrape = async () => {
    yargs(process.argv).usage('Scrape FACR players')

    const { facrPlayersScraper, clubRepository, playerService } = await createContainer()
    const clubToScrape = ['20B0641'] // dukla + sparta + slavia - '1060231', '1060221', '1060201', '1070041', '10A0091', '1070061'
    const allClubs = await clubRepository.find({
        where: {
            facrId: In(clubToScrape),
        },
    })
    if (!allClubs.length) {
        throw new Error(
            'Players script: No clubs to scrape players from found. Scrape clubs first.',
        )
    }

    const clubsScrapedPlayers = await facrPlayersScraper.scrapePlayersOfClubs(allClubs)

    for (const { scrapedPlayers } of clubsScrapedPlayers) {
        await playerService.processNewPlayersOfClub(scrapedPlayers.map(toNewPlayerRequest))
    }
}

scrape()
    .then(() => {
        console.log('✅ Players script done.')
        process.exit(0)
    })
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
