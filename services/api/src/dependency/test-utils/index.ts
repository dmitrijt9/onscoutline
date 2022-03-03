import supertest from 'supertest'
import { Repository } from 'typeorm'
import { ClubRepository } from '../../repositories/ClubRepository'
import { CompetitionRepository } from '../../repositories/CompetitionRepository'
import { ExpressApplication } from '../application/ExpressApplication'
import { getAppConfig } from '../config/index'
import { Container, createContainer } from '../container/index'

export type TestingClient = {
    application: ExpressApplication
    request: supertest.SuperTest<supertest.Test>
    container: Container
}

export const createTestingClient = async (container?: Container): Promise<TestingClient> => {
    const baseConfig = getAppConfig(process.env)
    const testContainer = container ?? {
        ...(await createContainer({
            ...baseConfig,
            db: {
                ...baseConfig.db,
                typeorm: {
                    ...baseConfig.db.typeormTest,
                },
            },
        })),
    }

    const application = new ExpressApplication(testContainer)
    const app = await application.start()

    return {
        application,
        request: supertest(app.expressApp),
        container: app.container,
    }
}

export const stopTestApplication = async (application: ExpressApplication) => {
    return application.stop()
}

export const cleanDb = async (client: TestingClient) => {
    const { typeormConnection } = client.container

    const repositories = [
        typeormConnection.getCustomRepository(CompetitionRepository),
        typeormConnection.getCustomRepository(ClubRepository),
    ]

    for (const repository of repositories) {
        await (repository as Repository<{}>).delete({})
    }
}
