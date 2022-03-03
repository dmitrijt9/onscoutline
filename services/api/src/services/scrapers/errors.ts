import { BaseError } from '../../dependency/errors/index'

export class FACRScraperElementNotFoundError extends BaseError {
    constructor(targetElement: string, message = 'FACR Scraper: Failed to scrape competitions') {
        super({
            message,
            payload: {
                targetElement,
            },
        })
    }
}
