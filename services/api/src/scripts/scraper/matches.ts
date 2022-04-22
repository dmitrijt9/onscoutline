import { createContainer } from '../../dependency/container/index'
import readFiles from '../../services/utils/read-files'
import yargs from 'yargs'

const scrape = async () => {
    yargs(process.argv).usage('Scrape FACR players')
    const defaultDirname = 'src/scripts/scraper/matches-lists-htmls/'

    const argv = await yargs(process.argv)
        .usage('Scrape and save matches from HTMLs')
        .option('path', {
            type: 'string',
            alias: 'p',
            describe: 'Path of a directory with target HTML files.',
            default: defaultDirname,
        })
        .help('h')
        .alias('h', 'help')
        .epilog('Onscoutline').argv

    const dirname = argv.path ?? defaultDirname

    const container = await createContainer()
    const htmlsToScrape: string[] = []
    try {
        readFiles(dirname, (_, content) => {
            htmlsToScrape.push(content)
        })
    } catch (e) {
        console.error('Error while reading html files.')
        throw e
    }
    const scrapedMatches = await container.facrMatchesScraper.scrapeMatches(htmlsToScrape)
    const { errors } = await container.matchService.createMatches(scrapedMatches)
    const unprocessedErrors = errors.filter((e) => e.errno !== 1062)
    console.error(unprocessedErrors)
}

scrape()
    .then(() => {
        console.log('✅ Matches script done.')
        process.exit(0)
    })
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
