import yargs from 'yargs'
import { createContainer } from '../../dependency/container/index'

const scrape = async () => {
    yargs(process.argv).usage('Scrape FACR competitions')

    const container = await createContainer()
    await container.facrScraper.scrapeAndSaveCompetitions()
}

scrape()
    .then(() => {
        console.log('successfully scraped and saved competitions')
        process.exit(0)
    })
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
