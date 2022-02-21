import { Connection, getCustomRepository } from 'typeorm'
import { CompetitionRepository } from '../../repositories/CompetitionRepository'
import { FacrScraper } from '../../services/scrapers/FacrScraper'
import { Scraper } from '../../services/scrapers/Scraper'
import { AppConfig, getAppConfig } from '../config/index'
import { bootstrapDbConnection } from './bootstrap/db-connection'

export const createContainer = async (
    appConfig = getAppConfig(process.env),
): Promise<Container> => {
    const typeormConnection = await bootstrapDbConnection(appConfig)

    const competitionRepository = getCustomRepository(CompetitionRepository)

    const scraper = new Scraper()
    const facrScraper = new FacrScraper(scraper, appConfig, competitionRepository)

    return {
        config: appConfig,
        typeormConnection,
        competitionRepository,
        facrScraper: facrScraper,
    }
}

export interface Container {
    config: AppConfig
    typeormConnection: Connection
    competitionRepository: CompetitionRepository
    facrScraper: FacrScraper
}
