import fetch from 'node-fetch'

const HARD_KILL_TIMEOUT_MS = 10 * 1000

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
    const response = await fetch('https://souteze.fotbal.cz/subjekty/')
    const body = response.text()
    console.log(body)
}

start().catch((err) => {
    console.error(`Error while starting the server ${err}`)
    process.exit(1)
})
