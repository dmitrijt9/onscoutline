import { exit } from 'process'
import { getAppConfig } from '../../dependency/config/index'
import { bootstrapDbConnection } from '../../dependency/container/bootstrap/db-connection'

const createDatabase = async () => {
    const config = getAppConfig(process.env)
    await bootstrapDbConnection(config.db.typeorm).then(async (connection) => {
        await connection.query('DROP DATABASE IF EXISTS test')
        await connection.createQueryRunner().query('CREATE DATABASE IF NOT EXISTS test')
        await connection.close()
    })

    console.log('Test DB reinstated successfully 🚀')
    exit()
}
createDatabase()
