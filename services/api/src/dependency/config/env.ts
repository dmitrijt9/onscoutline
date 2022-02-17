import { cleanEnv, num, str } from 'envalid'

export const getValidatedEnvironment = (envs: unknown) =>
    cleanEnv(envs, {
        NODE_ENV: str({ choices: ['development', 'test', 'production'] }),
        HTTP_SERVER_PORT: num(),
        DB_NAME: str(),
        DB_USER: str(),
        DB_HOST: str(),
        DB_PORT: num(),
        DB_PASSWORD: str(),
    })

export type AppEnv = ReturnType<typeof getValidatedEnvironment>
