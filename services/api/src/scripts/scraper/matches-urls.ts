import yargs from 'yargs'
import { createContainer } from '../../dependency/container/index'

const scrape = async () => {
    const defaultFilePath = 'matches-url-to-open.txt'

    const argv = await yargs(process.argv)
        .usage('Get FACR matches lists urls')
        .option('path', {
            type: 'string',
            alias: 'p',
            describe: 'Path of a file to write the output.',
            default: defaultFilePath,
        })
        .help('h')
        .alias('h', 'help')
        .epilog('Onscoutline').argv

    const filePath = argv.path ?? defaultFilePath

    const container = await createContainer()
    await container.facrScraper.saveMatchesListUrlsToFile(filePath)
}

scrape()
    .then(() => {
        process.exit(0)
    })
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
