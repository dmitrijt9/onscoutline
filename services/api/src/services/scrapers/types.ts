import { HTMLElement } from 'node-html-parser'

export interface IScraper {
    getParsedPage(url: string): Promise<HTMLElement>
}
