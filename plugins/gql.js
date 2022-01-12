'use strict'

const fp = require('fastify-plugin')
const { makeExecutableSchema } = require('@graphql-tools/schema')

module.exports = fp(async (fastify, options) => {
  const typeDefs = require('../gql/types')
  const resolvers = require('../gql/resolvers')
  const loaders = require('../gql/loaders')

  fastify.register(require('mercurius'), {
    ...options.graphql,
    schema: makeExecutableSchema({
      typeDefs,
      resolvers
    }),
    loaders,
    context: async (req) => {
      return {
        log: fastify.log
      }
    }
  })
}, { name: 'mercurius' })
