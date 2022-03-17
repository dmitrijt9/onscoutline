import { Connection, getCustomRepository } from 'typeorm'
import { ClubRepository } from '../../repositories/club/ClubRepository'
import { CompetitionRepository } from '../../repositories/competition/CompetitionRepository'
import { MatchRepository } from '../../repositories/match/MatchRepository'
import { PlayerInClubRepository } from '../../repositories/player/PlayerInClubRepository'
import { PlayerInMatchRepository } from '../../repositories/player/PlayerInMatchRepository'
import { PlayerRepository } from '../../repositories/player/PlayerRepository'
import { ClubService } from '../../services/club/ClubService'
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
    const playerInMatchRepository = getCustomRepository(PlayerInMatchRepository)
    const matchRepository = getCustomRepository(MatchRepository)

    const playerService = new PlayerService(
        playerRepository,
        playerInClubRepository,
        clubRepository,
    )
    const competitionService = new CompetitionService(competitionRepository, appConfig)
    const clubService = new ClubService(clubRepository)

    const puppeteerBrowser = new PuppeteerBrowser()
    const facrScraper = new FacrScraper(appConfig, puppeteerBrowser)

    return {
        config: appConfig,
        typeormConnection,

        competitionRepository,
        clubRepository,
        playerRepository,
        playerInClubRepository,
        playerInMatchRepository,
        matchRepository,

        facrScraper: facrScraper,
        competitionService,
        clubService,
        playerService,
    }
}

export interface Container {
    config: AppConfig
    typeormConnection: Connection
    competitionRepository: CompetitionRepository
    clubRepository: ClubRepository
    playerRepository: PlayerRepository
    playerInClubRepository: PlayerInClubRepository
    playerInMatchRepository: PlayerInMatchRepository
    matchRepository: MatchRepository
    facrScraper: IFacrScraper
    competitionService: CompetitionService
    clubService: ClubService
    playerService: PlayerService
}
