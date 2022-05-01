import { ClubRepository } from '../../repositories/club/ClubRepository'
import { CompetitionHasSeasonRepository } from '../../repositories/competition/CompetitionHasSeasonRepository'
import { CompetitionRepository } from '../../repositories/competition/CompetitionRepository'
import { MatchRepository } from '../../repositories/match/MatchRepository'
import { PlayerInClubRepository } from '../../repositories/player/PlayerInClubRepository'
import { PlayerInMatchRepository } from '../../repositories/player/PlayerInMatchRepository'
import { PlayerRepository } from '../../repositories/player/PlayerRepository'
import { SeasonRepository } from '../../repositories/season/SeasonRepository'
import { PlayerGameStatisticRepository } from '../../repositories/statistic/PlayerGameStatisticRepository'
import { ExpressApplication } from '../application/ExpressApplication'
import { getAppConfig } from '../config/index'
import { Container, createContainer } from '../container/index'
import { Repository } from 'typeorm'
import supertest from 'supertest'

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
        typeormConnection.getCustomRepository(PlayerInClubRepository),
        typeormConnection.getCustomRepository(PlayerGameStatisticRepository),
        typeormConnection.getCustomRepository(PlayerInMatchRepository),
        typeormConnection.getCustomRepository(MatchRepository),
        typeormConnection.getCustomRepository(CompetitionHasSeasonRepository),
        typeormConnection.getCustomRepository(SeasonRepository),
        typeormConnection.getCustomRepository(CompetitionRepository),
        typeormConnection.getCustomRepository(ClubRepository),
        typeormConnection.getCustomRepository(PlayerRepository),
    ]

    for (const repository of repositories) {
        await (repository as Repository<{}>).delete({})
    }
}
