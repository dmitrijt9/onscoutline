import yargs from 'yargs'
import { createContainer } from '../../dependency/container/index'

const scrape = async () => {
    yargs(process.argv).usage('Scrape FACR competitions')

    const { facrScraper, competitionService } = await createContainer()
    const scrapedCompetitions = await facrScraper.scrapeCompetitions()
    await competitionService.saveNewCompetitions(scrapedCompetitions)
}

scrape()
    .then(() => {
        console.log('✅ Competitions script done.')
        process.exit(0)
    })
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
