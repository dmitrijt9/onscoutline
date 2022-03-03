import yargs from 'yargs'
import { createContainer } from '../../dependency/container/index'

const scrape = async () => {
    const defaultDirname = 'src/scripts/scraper/club-lists-htmls/'

    const argv = await yargs(process.argv)
        .usage('Scrape and save clubs from HTMLs')
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
    await container.facrScraper.scrapeAndSaveClubs(dirname)
}

scrape()
    .then(() => {
        process.exit(0)
    })
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
