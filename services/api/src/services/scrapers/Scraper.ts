import axios from 'axios'
import parse, { HTMLElement } from 'node-html-parser'
import { IScraper } from './types'

export abstract class Scraper implements IScraper {
    async getParsedPage(url: string): Promise<HTMLElement> {
        const { data, status } = await axios.get(url, { timeout: 100 * 1000 })

        if (status !== 200) {
            // TODO: Add custom error with payload
            throw new Error(
                `Scraper: Error with status ${status} while fetching data from source. ${data}`,
            )
        }
        return parse(data)
    }
}
