import { createContainer } from '../../dependency/container/index'
import { toNewPlayerRequest } from '../../services/player/mappings/create-player-mappings'
import yargs from 'yargs'

const scrape = async () => {
    yargs(process.argv).usage('Scrape FACR players')

    const { facrPlayersScraper, clubRepository, playerService } = await createContainer()
    const allClubs = await clubRepository.find({
        take: 2,
    })
    if (!allClubs.length) {
        throw new Error(
            'Players script: No clubs to scrape players from found. Scrape clubs first.',
        )
    }

    const clubsScrapedPlayers = await facrPlayersScraper.scrapePlayersOfClubs(allClubs)

    for (const { club, scrapedPlayers } of clubsScrapedPlayers) {
        await playerService.processNewPlayersOfClub(scrapedPlayers.map(toNewPlayerRequest), club)
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
