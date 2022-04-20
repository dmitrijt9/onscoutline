import { IScraper } from './types'
import axios from 'axios'
import parse, { HTMLElement } from 'node-html-parser'

export abstract class AbstractScraper implements IScraper {
    async getParsedPage(url: string): Promise<HTMLElement> {
        const { data, status } = await axios.get(url, { timeout: 10 * 1000 })

        if (status !== 200) {
            // TODO: Add custom error with payload
            throw new Error(
                `Scraper: Error with status ${status} while fetching data from source. ${data}`,
            )
        }
        return this.parseHtml(data)
    }

    parseHtml(htmlString: string) {
        return parse(htmlString)
    }
}
