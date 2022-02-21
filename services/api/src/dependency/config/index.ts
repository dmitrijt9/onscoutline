import { databaseConfig } from './database-config'
import { getValidatedEnvironment } from './env'
import { facrScraperConfig } from './facr-scraper-config'

export type AppConfig = ReturnType<typeof getAppConfig>

export const getAppConfig = (unvalidatedEnv: unknown) => {
    const env = getValidatedEnvironment(unvalidatedEnv)
    return {
        environment: env.NODE_ENV,
        httpServerPort: env.HTTP_SERVER_PORT ?? 3000,
        facrScraper: facrScraperConfig(),
        db: databaseConfig(env),
        // logger: {
        //     level: env.LOGGER_LEVEL,
        // },
        // sentry: sentryConfig(env),
    }
}
