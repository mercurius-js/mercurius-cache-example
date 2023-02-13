'use strict'

const fastify = require('fastify')
const closeWithGrace = require('close-with-grace')
const config = require('./lib/config')
const logger = require('./lib/logger')(config.log)
const services = require('./app')

async function main () {
  const app = fastify({ logger })
  app.register(services(config))

  const closeListeners = closeWithGrace({ delay: 500 }, async function ({ err }) {
    if (err) {
      app.log.error({ msg: 'error closing app', err })
    }
    await app.close()
    app.log.info({ msg: 'app closed' })
  })

  app.addHook('onClose', (instance, done) => {
    closeListeners.uninstall()
    done()
  })

  try {
    await app.listen({ port: config.app.port, host: '0.0.0.0' })
    logger.info('ready!')
  } catch (err) {
    app.log.fatal({ msg: 'error starting app', err })
    process.exit(1)
  }
}

main()
