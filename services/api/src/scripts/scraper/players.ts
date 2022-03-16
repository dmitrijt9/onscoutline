import yargs from 'yargs'
import { createContainer } from '../../dependency/container/index'

const scrape = async () => {
    yargs(process.argv).usage('Scrape FACR players')

    const { facrScraper, clubRepository, playerService } = await createContainer()
    const allClubs = await clubRepository.find()
    if (!allClubs.length) {
        throw new Error(
            'Players script: No clubs to scrape players from found. Scrape clubs first.',
        )
    }

    const scrapedPlayersMap = await facrScraper.scrapePlayersOfClubs(allClubs)
    for (const [key, value] of Object.entries(scrapedPlayersMap)) {
        await playerService.processNewPlayersOfClub(value, key)
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
