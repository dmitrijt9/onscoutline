import { ClubResolver } from './club/index'
import { GraphQLSchema } from 'graphql'
import { buildSchema } from 'type-graphql'

export const buildGqlSchema = async (): Promise<GraphQLSchema> => {
    return buildSchema({
        resolvers: [ClubResolver],
        globalMiddlewares: [
            // TODO: error middleware
            // ErrorInterceptor
        ],
    })
}
