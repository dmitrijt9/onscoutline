import puppeteer, {
    Browser,
    LaunchOptions,
    BrowserLaunchArgumentOptions,
    BrowserConnectOptions,
    Page,
    ElementHandle,
} from 'puppeteer'
import { TPuppeteerSelector, TPuppeteerSelectorOptions } from './types'

export class PuppeteerBrowser {
    async launch(
        options?: LaunchOptions & BrowserLaunchArgumentOptions & BrowserConnectOptions,
    ): Promise<Browser> {
        return await puppeteer.launch(
            options ?? {
                executablePath: '/usr/bin/chromium',
                args: ['--no-sandbox'],
                headless: true,
            },
        )
    }

    async waitForSelector(
        selector: TPuppeteerSelector,
        frame: Page,
        options?: TPuppeteerSelectorOptions,
    ): Promise<ElementHandle | undefined> {
        if (!Array.isArray(selector)) {
            selector = [selector]
        }
        if (!selector.length) {
            throw new Error('Empty selector provided to waitForSelector')
        }
        let element: ElementHandle | null = null
        for (let i = 0; i < selector.length; i++) {
            const part = selector[i]
            if (element) {
                element = await element.waitForSelector(part, options)
            } else {
                element = await frame.waitForSelector(part, options)
            }
            if (!element) {
                throw new Error('Could not find element: ' + selector.join('>>'))
            }
            if (i < selector.length - 1) {
                element = (
                    await element.evaluateHandle((el) => (el.shadowRoot ? el.shadowRoot : el))
                ).asElement()
            }
        }
        if (!element) {
            throw new Error('Could not find element: ' + selector.join('|'))
        }
        return element
    }

    async waitForSelectors(
        selectors: TPuppeteerSelector,
        frame: Page,
        options: TPuppeteerSelectorOptions,
    ): Promise<ElementHandle | undefined> {
        for (const selector of selectors) {
            try {
                return await this.waitForSelector(selector, frame, options)
            } catch (err) {
                console.error(err)
            }
        }
        throw new Error('Could not find element for selectors: ' + JSON.stringify(selectors))
    }

    async scrollIntoViewIfNeeded(element: ElementHandle, timeout: number): Promise<void> {
        await this.waitForConnected(element, timeout)
        const isInViewport = await element.isIntersectingViewport({ threshold: 0 })
        if (isInViewport) {
            return
        }
        await element.evaluate((element) => {
            element.scrollIntoView({
                block: 'center',
                inline: 'center',
                behavior: 'auto',
            })
        })
        await this.waitForInViewport(element, timeout)
    }

    private async waitForFunction(fn: () => Promise<any>, timeout: number) {
        let isActive = true
        setTimeout(() => {
            isActive = false
        }, timeout)
        while (isActive) {
            const result = await fn()
            if (result) {
                return
            }
            await new Promise((resolve) => setTimeout(resolve, 100))
        }
        throw new Error('Timed out')
    }

    private async waitForConnected(element: ElementHandle, timeout: number): Promise<void> {
        await this.waitForFunction(async () => {
            return await element.getProperty('isConnected')
        }, timeout)
    }

    private async waitForInViewport(element: ElementHandle, timeout: number): Promise<void> {
        await this.waitForFunction(async () => {
            return await element.isIntersectingViewport({ threshold: 0 })
        }, timeout)
    }
}
