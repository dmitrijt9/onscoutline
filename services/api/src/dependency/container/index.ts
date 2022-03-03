import { Connection, getCustomRepository } from 'typeorm'
import { ClubRepository } from '../../repositories/ClubRepository'
import { CompetitionRepository } from '../../repositories/CompetitionRepository'
import { FacrScraper } from '../../services/scrapers/FacrScraper'
import { IFacrScraper } from '../../services/scrapers/types'
import { AppConfig, getAppConfig } from '../config/index'
import { bootstrapDbConnection } from './bootstrap/db-connection'

export const createContainer = async (
    appConfig = getAppConfig(process.env),
): Promise<Container> => {
    const typeormConnection = await bootstrapDbConnection(appConfig)

    const competitionRepository = getCustomRepository(CompetitionRepository)
    const clubRepository = getCustomRepository(ClubRepository)

    const facrScraper = new FacrScraper(appConfig, competitionRepository, clubRepository)

    return {
        config: appConfig,
        typeormConnection,
        competitionRepository,
        clubRepository,
        facrScraper: facrScraper,
    }
}

export interface Container {
    config: AppConfig
    typeormConnection: Connection
    competitionRepository: CompetitionRepository
    clubRepository: ClubRepository
    facrScraper: IFacrScraper
}
