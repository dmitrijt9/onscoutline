import * as http from 'http'
import { Container, createContainer } from '../container/index'
import { createCustomErrorHandler } from '../errors/custom-error-handler'
import { GraphqlContext } from '../../graphql/types'
import { buildGqlSchema } from '../../graphql/index'
import helmet from 'helmet'
import express, { Express, json, Router, urlencoded } from 'express'
import { ApolloServer, ExpressContext } from 'apollo-server-express'
import { ContextFunction } from 'apollo-server-core'

export class ExpressApplication {
    private _httpServer: http.Server | null

    private _expressApp: Express

    private _container: Container

    private _apolloContext: GraphqlContext | ContextFunction<ExpressContext>

    private static readonly DEFAULT_SHUTDOWN_TIMEOUT_MS = 10 * 1000

    get container(): Container {
        return this._container
    }
    set container(value: Container) {
        this._container = value
    }

    get httpServer(): http.Server | null {
        return this._httpServer
    }

    set httpServer(value: http.Server | null) {
        this._httpServer = value
    }

    get expressApp(): Express {
        return this._expressApp
    }
    set expressApp(value: Express) {
        this._expressApp = value
    }

    get apolloContext(): GraphqlContext | ContextFunction<ExpressContext> {
        return this._apolloContext
    }

    set apolloContext(value: GraphqlContext | ContextFunction<ExpressContext>) {
        this._apolloContext = value
    }

    constructor(container?: Container) {
        if (container) {
            this.container = container
        }
    }

    async initExpressApp(container: Container) {
        const expressRouter = await this.initExpressRouter()
        const { config } = container
        const isDevelopment = config.environment === 'development'
        return express()
            .use(
                helmet({
                    crossOriginEmbedderPolicy: !isDevelopment,
                    contentSecurityPolicy: !isDevelopment,
                }),
            )
            .use(urlencoded({ extended: true }))
            .use(json())
            .use('/', expressRouter)
            .use(createCustomErrorHandler(container.logger))
        // .use(Sentry.Handlers.errorHandler())
    }

    async initExpressRouter() {
        const router = Router()
        // TODO: move elsewhere
        router.get('/status', (req, res) => {
            res.status(200).send('ok')
        })

        const apolloServer = await this.startApolloServer()
        router.use('/graphql', apolloServer.getMiddleware({ path: '/' }))
        return router
    }

    async startApolloServer() {
        if (!this.apolloContext) {
            this.apolloContext = (expressCtx: ExpressContext): Required<GraphqlContext> => {
                return {
                    container: this.container,
                    express: expressCtx,
                }
            }
        }

        const schema = await buildGqlSchema()
        const apolloServer = new ApolloServer({
            schema,
            context: this.apolloContext,
        })
        await apolloServer.start()
        return apolloServer
    }

    async start(): Promise<this> {
        console.info('SERVER: Begin start process.')

        if (!this.container) {
            this.container = await createContainer()
        }

        this.expressApp = await this.initExpressApp(this.container)
        const { config } = this.container
        this.httpServer = this.expressApp.listen(config.httpServerPort, () => {
            console.log(`SERVER: Running on port ${config.httpServerPort}`)
        })

        return this
    }

    async stop(): Promise<void> {
        console.info('SERVER: Besgin stop process.')
        try {
            await this.httpServer?.close()
            console.log(`SERVER: Stop process is complete.`)
        } catch (e) {
            console.error(`SERVER: Error while stopping the server: ${e}`)
            throw e
        }
    }

    async shutdown(timeout?: number): Promise<void> {
        console.info(`SERVER: Shutting down...`)

        // kill myself in case of shutdown failures/hang-ups
        const killTimeoutHandle = setTimeout(
            () => process.exit(1),
            timeout ?? ExpressApplication.DEFAULT_SHUTDOWN_TIMEOUT_MS,
        )
        try {
            await this.stop()
            process.exit(0)
        } catch (err) {
            console.error(`SERVER: Error while shuting down the server: ${err}`)
            process.exit(1)
        } finally {
            clearTimeout(killTimeoutHandle)
        }
    }
}
