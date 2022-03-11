import { BaseError } from '../../dependency/errors/index'

export class FACRScraperElementNotFoundError extends BaseError {
    constructor(
        targetElement: string,
        subject: string,
        querySelector = '',
        message = `FACR Scraper: Failed to scrape ${subject}`,
    ) {
        super({
            message,
            payload: {
                targetElement,
                querySelector,
            },
        })
    }
}
