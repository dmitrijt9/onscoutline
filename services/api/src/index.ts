import axios from 'axios'
import { parse } from 'node-html-parser'

const signals = {
    SIGHUP: 1,
    SIGINT: 2,
    SIGTERM: 15,
}

Object.keys(signals).forEach((signal) => {
    process.on(signal, async () => {
        console.log(`SERVER: Got ${signal}. Graceful shutdown.`)
        // TODO: application shutdown
        process.exit(0)
    })
})

const start = async () => {
    // TODO: Start actual application
    console.log('Start app...')

    try {
        const { data } = await axios.get('https://souteze.fotbal.cz/subjekty/')
        const parsedPage = parse(data)
        const competitionsUrls = parsedPage.querySelectorAll('div.box a.btn').map((atag) => {
            return atag.getAttribute('href')
        })
        console.log(competitionsUrls, `length: ${competitionsUrls.length}`)
    } catch (e) {
        console.error(e)
    }
}

start().catch((err) => {
    console.error(`Error while starting the server ${err}`)
    process.exit(1)
})
