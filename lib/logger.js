'use strict'

// NOTE: setup for educational purposes only

const pino = require('pino')

module.exports = (options) => {
  const pinoOptions = {
    level: options.level,
    formatters: {
      level (label) {
        return { level: label.toUpperCase() }
      }
    }
  }

  if (options.pretty) {
    pinoOptions.transport = {
      target: 'pino-pretty',
      options: {
        colorize: true
      }
    }
  }

  return pino(pinoOptions)
}
