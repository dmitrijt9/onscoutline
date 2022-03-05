import { Connection, getCustomRepository } from 'typeorm'
import { ClubRepository } from '../../repositories/ClubRepository'
import { CompetitionRepository } from '../../repositories/CompetitionRepository'
import { PlayerInClubRepository } from '../../repositories/PlayerInClubRepository'
import { PlayerRepository } from '../../repositories/PlayerRepository'
import { FacrScraper } from '../../services/scrapers/FacrScraper'
import { IFacrScraper } from '../../services/scrapers/types'
import { AppConfig, getAppConfig } from '../config/index'
import { bootstrapDbConnection } from './bootstrap/db-connection'

export const createContainer = async (
    appConfig = getAppConfig(process.env),
): Promise<Container> => {
    const typeormConnection = await bootstrapDbConnection(appConfig.db.typeorm)

    const competitionRepository = getCustomRepository(CompetitionRepository)
    const clubRepository = getCustomRepository(ClubRepository)
    const playerRepository = getCustomRepository(PlayerRepository)
    const playerInClubRepository = getCustomRepository(PlayerInClubRepository)

    const facrScraper = new FacrScraper(appConfig, competitionRepository, clubRepository)

    return {
        config: appConfig,
        typeormConnection,

        competitionRepository,
        clubRepository,
        playerRepository,
        playerInClubRepository,

        facrScraper: facrScraper,
    }
}

export interface Container {
    config: AppConfig
    typeormConnection: Connection
    competitionRepository: CompetitionRepository
    clubRepository: ClubRepository
    playerRepository: PlayerRepository
    playerInClubRepository: PlayerInClubRepository
    facrScraper: IFacrScraper
}
