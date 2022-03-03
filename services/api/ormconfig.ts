import { databaseConfig } from './src/dependency/config/database-config'
import { getValidatedEnvironment } from './src/dependency/config/env'

export default {
    ...databaseConfig(getValidatedEnvironment(process.env)).typeorm,
}
