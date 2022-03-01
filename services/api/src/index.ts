import { ExpressApplication } from './dependency/application/ExpressApplication'

const signals = {
    SIGHUP: 1,
    SIGINT: 2,
    SIGTERM: 15,
}

const HARD_KILL_TIMEOUT = 10 * 1000

// Should be more abstract.. Something like new Application, which extends Express Application.
// But quite sure, that I will have just this express aplication the whole time.
const expressApplication = new ExpressApplication()

Object.keys(signals).forEach((signal) => {
    process.on(signal, async () => {
        console.log(`SERVER: Got ${signal}. Graceful shutdown.`)
        await expressApplication.shutdown(HARD_KILL_TIMEOUT)
        process.exit(0)
    })
})

expressApplication.start().catch((err) => {
    console.error(`Error while starting the server ${err}`)
    process.exit(1)
})
