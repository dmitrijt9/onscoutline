import { Connection, getCustomRepository } from 'typeorm'
import { ClubRepository } from '../../repositories/ClubRepository'
import { CompetitionRepository } from '../../repositories/CompetitionRepository'
import { PlayerInClubRepository } from '../../repositories/PlayerInClubRepository'
import { PlayerRepository } from '../../repositories/PlayerRepository'
import { CompetitionService } from '../../services/competition/CompetitionService'
import { PlayerService } from '../../services/player/PlayerService'
import { FacrScraper } from '../../services/scrapers/FacrScraper'
import { PuppeteerBrowser } from '../../services/scrapers/PuppeteerBrowser'
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

    const playerService = new PlayerService(playerRepository, playerInClubRepository)
    const competitionService = new CompetitionService(competitionRepository, appConfig)

    const puppeteerBrowser = new PuppeteerBrowser()
    const facrScraper = new FacrScraper(
        appConfig,
        competitionRepository,
        clubRepository,
        playerService,
        puppeteerBrowser,
    )

    return {
        config: appConfig,
        typeormConnection,

        competitionRepository,
        clubRepository,
        playerRepository,
        playerInClubRepository,

        facrScraper: facrScraper,
        competitionService,
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
    competitionService: CompetitionService
}
