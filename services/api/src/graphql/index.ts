import { ClubResolver } from './club/index'
import { registerEnums } from './enums'
import { PersonInfoFieldResolvers } from './player/resolvers/person-info-field-resolvers'
import { PlayerFieldResolvers } from './player/resolvers/player-field-resolvers'
import { PlayerResolver } from './player/resolvers/index'
import { GraphQLSchema } from 'graphql'
import { buildSchema } from 'type-graphql'

export const buildGqlSchema = async (): Promise<GraphQLSchema> => {
    // register enum types to graphql schema
    registerEnums()
    return buildSchema({
        resolvers: [
            ClubResolver,
            PlayerResolver,

            // field resolvers
            PersonInfoFieldResolvers,
            PlayerFieldResolvers,
        ],
        globalMiddlewares: [
            // TODO: error middleware
            // ErrorInterceptor
        ],
    })
}
