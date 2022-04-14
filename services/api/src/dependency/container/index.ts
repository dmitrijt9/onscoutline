import { Connection, getCustomRepository } from 'typeorm'
import { ClubRepository } from '../../repositories/club/ClubRepository'
import { CompetitionHasSeasonRepository } from '../../repositories/competition/CompetitionHasSeasonRepository'
import { CompetitionRepository } from '../../repositories/competition/CompetitionRepository'
import { MatchRepository } from '../../repositories/match/MatchRepository'
import { PlayerInClubRepository } from '../../repositories/player/PlayerInClubRepository'
import { PlayerInMatchRepository } from '../../repositories/player/PlayerInMatchRepository'
import { PlayerRepository } from '../../repositories/player/PlayerRepository'
import { SeasonRepository } from '../../repositories/season/SeasonRepository'
import { PlayerGameStatisticRepository } from '../../repositories/statistic/PlayerGameStatisticRepository'
import { ClubService } from '../../services/club/ClubService'
import { CompetitionService } from '../../services/competition/CompetitionService'
import { ConsoleLogger } from '../../services/logger/ConsoleLogger'
import { ILogger } from '../../services/logger/ILogger'
import { MatchService } from '../../services/match/MatchService'
import { PlayerService } from '../../services/player/PlayerService'
import { FacrScraper } from '../../services/scrapers/FacrScraper'
import { PuppeteerBrowser } from '../../services/scrapers/PuppeteerBrowser'
import { IFacrScraper } from '../../services/scrapers/types'
import { SeasonService } from '../../services/season/SeasonService'
import { StatisticsService } from '../../services/statistics/StatisticsService'
import { AppConfig, getAppConfig } from '../config/index'
import { bootstrapDbConnection } from './bootstrap/db-connection'

export const createContainer = async (
    appConfig = getAppConfig(process.env),
): Promise<Container> => {
    const logger = new ConsoleLogger(appConfig)
    const typeormConnection = await bootstrapDbConnection(appConfig.db.typeorm)

    const competitionRepository = getCustomRepository(CompetitionRepository)
    const competitionHasSeasonRepository = getCustomRepository(CompetitionHasSeasonRepository)
    const clubRepository = getCustomRepository(ClubRepository)
    const playerRepository = getCustomRepository(PlayerRepository)
    const playerInClubRepository = getCustomRepository(PlayerInClubRepository)
    const playerInMatchRepository = getCustomRepository(PlayerInMatchRepository)
    const matchRepository = getCustomRepository(MatchRepository)
    const seasonRepository = getCustomRepository(SeasonRepository)
    const playerGameStatisticsRepository = getCustomRepository(PlayerGameStatisticRepository)

    const statisticsService = new StatisticsService()
    const playerService = new PlayerService(
        playerRepository,
        playerInClubRepository,
        playerInMatchRepository,
        clubRepository,
        statisticsService,
        playerGameStatisticsRepository,
    )
    const competitionService = new CompetitionService(
        competitionRepository,
        competitionHasSeasonRepository,
        appConfig,
    )
    const clubService = new ClubService(clubRepository)

    const puppeteerBrowser = new PuppeteerBrowser()
    const facrScraper = new FacrScraper(appConfig, puppeteerBrowser)

    const seasonService = new SeasonService(seasonRepository)

    const matchService = new MatchService(
        seasonService,
        competitionRepository,
        competitionService,
        clubRepository,
        playerRepository,
        playerService,
        matchRepository,
    )

    return {
        config: appConfig,
        logger,
        typeormConnection,

        competitionRepository,
        competitionHasSeasonRepository,
        clubRepository,
        playerRepository,
        playerInClubRepository,
        playerInMatchRepository,
        matchRepository,
        seasonRepository,
        playerGameStatisticsRepository,

        facrScraper: facrScraper,
        competitionService,
        clubService,
        playerService,
        seasonService,
        matchService,
        statisticsService,
    }
}

export interface Container {
    config: AppConfig
    logger: ILogger
    typeormConnection: Connection

    competitionRepository: CompetitionRepository
    competitionHasSeasonRepository: CompetitionHasSeasonRepository
    clubRepository: ClubRepository
    playerRepository: PlayerRepository
    playerInClubRepository: PlayerInClubRepository
    playerInMatchRepository: PlayerInMatchRepository
    matchRepository: MatchRepository
    seasonRepository: SeasonRepository
    playerGameStatisticsRepository: PlayerGameStatisticRepository

    facrScraper: IFacrScraper
    competitionService: CompetitionService
    clubService: ClubService
    playerService: PlayerService
    seasonService: SeasonService
    matchService: MatchService
    statisticsService: StatisticsService
}
