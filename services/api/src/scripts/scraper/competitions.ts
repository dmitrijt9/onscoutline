import { createContainer } from '../../dependency/container/index'
import yargs from 'yargs'

const scrape = async () => {
    yargs(process.argv).usage('Scrape FACR competitions')

    const { facrCompetitionsScraper, competitionService } = await createContainer()
    const scrapedCompetitions = await facrCompetitionsScraper.scrapeCompetitions()
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
