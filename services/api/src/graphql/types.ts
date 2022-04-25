import { Container } from '../dependency/container/index'
import { ExpressContext } from 'apollo-server-express'

export type GraphqlContext = {
    container: Container
    // user: User
    // loaders: ContextLoaders
    express?: ExpressContext
}
