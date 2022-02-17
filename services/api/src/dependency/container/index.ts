import { FacrScraper } from '../../services/scrapers/FacrScraper'
import { Scraper } from '../../services/scrapers/Scraper'
import { AppConfig, getAppConfig } from '../config/index'

export const createContainer = async (
    appConfig = getAppConfig(process.env),
): Promise<Container> => {
    const scraper = new Scraper()
    const facrScraper = new FacrScraper(scraper, appConfig)

    return {
        config: appConfig,
        facrScraper: facrScraper,
    }
}

export interface Container {
    config: AppConfig
    facrScraper: FacrScraper
}
