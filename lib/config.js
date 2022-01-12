'use strict'

/* istanbul ignore file */

const path = require('path')
const pino = require('pino')
const envSchema = require('env-schema')
const S = require('fluent-json-schema')

const config = envSchema({
  schema: S.object()
    .prop('NODE_ENV', S.string().default('production'))

    .prop('FASTIFY_PORT', S.number().default(3000))
    .prop('FASTIFY_LOG_LEVEL', S.string().enum(Object.values(pino().levels.labels))).default('warn')
    .prop('FASTIFY_PRETTY_LOGS', S.boolean().default(true))

    .prop('REDIS_HOST', S.string().default('127.0.0.1'))
    .prop('REDIS_PORT', S.number().default(6379))

    .prop('CACHE_DEFAULT_TTL', S.number().default(86400)) // 1 day
    .prop('CACHE_STORAGE_TYPE', S.string().default('redis'))
    .prop('CACHE_LOG_INTERVAL', S.number().default(30)) // 30 sec

    .prop('CACHE_GC_CHUNK', S.number().default(32))
    .prop('CACHE_GC_LAZY_CHUNK', S.number().default(64))
    .prop('CACHE_GC_LAZY_INTERVAL', S.number().default(60e3)) // 1 min
    .prop('CACHE_GC_STRICT_INTERVAL', S.number().default(5 * 60e3)) // 5 min

    .prop('GRAPHQL_PLAYGROUND', S.boolean().default(true)),

  dotenv: true
})

module.exports = {
  env: config.NODE_ENV,
  log: {
    level: config.FASTIFY_LOG_LEVEL,
    pretty: config.FASTIFY_PRETTY_LOGS
  },
  app: {
    port: config.FASTIFY_PORT
  },
  autoload: [
    { path: path.join(__dirname, '../plugins') }
  ],
  // fastify-redis options
  redis: {
    host: config.REDIS_HOST,
    port: config.REDIS_PORT
  },
  // mercurius options
  graphql: {
    dir: path.join(__dirname, '../gql'),
    graphiql: config.GRAPHQL_PLAYGROUND
  },
  // mercurius-cache options
  cache: {
    ttl: config.CACHE_DEFAULT_TTL,
    type: config.CACHE_STORAGE_TYPE,
    memory: {
      size: config.CACHE_STORAGE_MEMORY_SIZE
    },
    redis: {},
    logInterval: config.CACHE_LOG_INTERVAL,
    gc: {
      chunk: config.CACHE_GC_CHUNK,
      lazyChunk: config.CACHE_GC_LAZY_CHUNK,
      lazyInterval: config.CACHE_GC_LAZY_INTERVAL,
      strictInterval: config.CACHE_GC_STRICT_INTERVAL
    }
  }
}
