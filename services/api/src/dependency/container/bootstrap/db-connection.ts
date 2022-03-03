import { Policy } from 'cockatiel'
import { Connection, ConnectionOptions, createConnection } from 'typeorm'

export const bootstrapDbConnection = async (config: ConnectionOptions): Promise<Connection> => {
    console.info('DB Bootstrap: Waiting for service...')

    const retry = Policy.handleAll()
        .retry()
        .exponential({ maxDelay: 15 * 1000, initialDelay: 1000 })

    retry.onFailure((error) => {
        console.error(
            `DB Bootstrap: Unable to create a connection to the database. Trying again... Original error: [${error}]`,
        )
        console.error(error)
    })

    retry.onSuccess(() => {
        console.info('DB Bootstrap: Connection established.')
    })

    return retry.execute(async () => {
        return await createConnection(config)
    })
}
