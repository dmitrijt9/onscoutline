import yargs from 'yargs'
import { createContainer } from '../../dependency/container/index'

const scrape = async () => {
    yargs(process.argv).usage('Scrape FACR players')

    const container = await createContainer()
    await container.facrScraper.scrapeAndSavePlayersOfAllClubs()
}

scrape()
    .then(() => {
        console.log('Script done')
        process.exit(0)
    })
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
