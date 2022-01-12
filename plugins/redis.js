'use strict'

const fp = require('fastify-plugin')

module.exports = fp(async (fastify, options) => {
  fastify.register(require('fastify-redis'), options.redis)
}, { name: 'redis' })
