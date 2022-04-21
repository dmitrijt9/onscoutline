import { entities } from '../../entities/index'
import { migrations } from '../../scripts/typeorm/migrations/index'
import { AppEnv } from './env'
import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions'

export const databaseConfig = (env: AppEnv) => ({
    typeorm: {
        type: 'mariadb',
        logging: true, // The logging output will only be enabled if the DEBUG env variable is provided. See https://orkhan.gitbook.io/typeorm/docs/logging#changing-default-logger for more info
        database: env.DB_NAME,
        username: env.DB_USER,
        password: env.DB_PASSWORD,
        port: env.DB_PORT ?? 3306,
        host: env.DB_HOST,
        entities: entities,
        migrations: migrations,
        synchronize: false,
        logger: 'debug',
        cache: true,
        cli: {
            entitiesDir: `${__dirname}/../../entities`,
            migrationsDir: `${__dirname}/../../scripts/typeorm/migrations`,
        },
        migrationsTableName: 'migrations',
        timezone: 'Z',
        extra: {
            connectionLimit: 5,
        },
        maxQueryExecutionTime: 1000,
        connectTimeout: 5000,
    } as MysqlConnectionOptions,
    typeormTest: {
        type: 'mariadb',
        logging: true, // The logging output will only be enabled if the DEBUG env variable is provided. See https://orkhan.gitbook.io/typeorm/docs/logging#changing-default-logger for more info
        database: 'test',
        username: 'root',
        password: 'root',
        port: env.DB_PORT ?? 3306,
        host: env.DB_HOST,
        entities: entities,
        migrations: migrations,
        synchronize: false,
        logger: 'debug',
        cache: true,
        cli: {
            entitiesDir: `${__dirname}/../../entities`,
            migrationsDir: `${__dirname}/../../scripts/typeorm/migrations`,
        },
        migrationsTableName: 'migrations',
        timezone: 'Z',
        extra: {
            connectionLimit: 5,
        },
        maxQueryExecutionTime: 1000,
        connectTimeout: 5000,
    } as MysqlConnectionOptions,
})
