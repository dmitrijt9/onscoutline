import { databaseConfig } from './src/dependency/config/database-config'
import { getValidatedEnvironment } from './src/dependency/config/env'

const { typeorm, typeormTest } = databaseConfig(getValidatedEnvironment(process.env))
export default process.env.NODE_ENV === 'test' ? typeormTest : typeorm
