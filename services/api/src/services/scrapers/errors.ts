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

export class FACRScraperNoHTMLS extends BaseError {
    constructor(
        dirname: string,
        subject: string,
        message = `FACR Scraper: No HTML files to scrape: ${subject}`,
    ) {
        super({
            message,
            payload: {
                dirname,
            },
        })
    }
}
