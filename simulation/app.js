'use strict'

const undici = require('undici')
const fastify = require('fastify')
const Redis = require('ioredis')
const chalk = require('chalk')
const { promisify } = require('util')
const sleep = promisify(setTimeout)

const PACE = process.env.PACE ?? 1e3

process.env.CACHE_DEFAULT_TTL = 2
process.env.CACHE_LOG_INTERVAL = 3

process.env.CACHE_GC_CHUNK = 5
process.env.CACHE_GC_LAZY_CHUNK = 3
process.env.CACHE_GC_LAZY_INTERVAL = 2e3
process.env.CACHE_GC_STRICT_INTERVAL = 10e3

const config = require('../lib/config')
const services = require('../app')

const logger = {
  info: (...args) => {
    if (!args[0].msg) {
      return
    }
    console.log(chalk.blueBright('logger >>>', JSON.stringify(args[0])))
  },
  trace: () => { },
  debug: () => { },
  warn: () => { },
  error: () => { },
  fatal: () => { },
  child: () => { return logger }
}
const redis = new Redis(config.redis)

async function request (query) {
  const { body } = await undici.request('http://localhost:3000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  })
  return (await body.json()).data
}

let app, monitor

async function start () {
  await redis.flushall()

  monitor = await redis.monitor()
  monitor.on('monitor', function (time, args, source, database) {
    console.log(chalk.redBright('redis >>>', ...args))
  })

  app = fastify({ logger })
  app.register(services(config))
  await app.listen(config.app.port, '0.0.0.0')
}

async function end () {
  await app.close()
  monitor.removeAllListeners()
  await redis.disconnect()
  process.exit(0)
}

// requests

const requests = [
  {
    title: 'dedupe the same request not cached, called first time',
    queries: Array(5).fill('{ users(page: 1) {name, groups { id }} }')
  },

  {
    title: 'dedupe the same request cached',
    queries: Array(5).fill('{ users(page: 1) {name, groups { id }} }')
  },

  {
    title: 'cache users page 2',
    queries: ['{ users(page: 2) {name, groups { id }} }']
  },

  {
    title: 'use cache users on page 2',
    queries: ['{ users(page: 2) {name, groups { id }} }']
  },

  {
    title: 'cache countries',
    queries: ['{ countries {id,name} }']
  },

  {
    title: 'get countries from cache',
    queries: ['{ countries {id,name} }']
  },

  // nested

  {
    title: 'cache nested users',
    queries: ['{ users(page: 3) {name,country {name},groups { id, name, users { id } } } }']
  },

  {
    title: 'get nested users from cache',
    queries: ['{ users(page: 3) {name,country {name},groups { id, name, users { id } } } }']
  },

  // invalidation

  {
    title: 'update user 2 and invalidate cache where it\'s involved',
    queries: ['mutation { updateUser(id: 2, user: { name: "Boris", country: "ru" }) {id, name, country {id}}}']
  },

  {
    title: 'page 2 not be invalidated from previous user update so it\'s served from cache',
    queries: ['{ users(page: 2) {name, groups { id }} }']
  },

  {
    title: 'cache users pages',
    queries: Array(3).fill(0).map((v, i) => `{ users(page: ${i + 1}) {name, groups { id }} }`)
  },

  {
    title: 'add a new user and invalidate all user pages',
    queries: [
      'mutation { addUser(user: { name: "John", country: "br" }) {id, name, country {id}}}'
    ]
  }
]

// fill

const filling = [
  {
    title: 'fill cache for gc',
    queries: Array(3).fill(0).map((v, i) => `{ users(page: ${i + 1}) {name, groups { name }} }`)
      .concat(Array(3).fill(0).map((v, i) => `{ groups(page: ${i + 1}) {name, users { name }} }`))
      .concat(Array(9).fill(0).map((v, i) => `{ user(id: ${i + 1}) {name, groups {name}} }`))
      .concat(Array(5).fill(0).map((v, i) => `{ group(id: ${i + 1}) {name, users {name}} }`))
  }
]

async function main () {
  await start()

  for (const { title, queries } of requests) {
    console.log(chalk.bold.bgWhite.blue(`*** ${title} ***`), '\n')
    console.log(chalk.yellow('query >>>', queries[0]))

    const requests = []
    for (const query of queries) {
      requests.push(request(query))
    }
    const responses = await Promise.all(requests)
    console.log(chalk.green('response >>>', JSON.stringify(responses[0])))

    console.log('\n-----------------------------------------------------------------')

    await sleep(PACE)
  }

  for (const _mode of ['lazy', 'strict']) {
    for (const { title, queries } of filling) {
      console.log(chalk.bold.bgWhite.blue(`*** ${title} ***`), '\n')
      console.log(chalk.yellow('query >>>', queries[0]))

      const requests = []
      for (const query of queries) {
        requests.push(request(query))
      }
      const responses = await Promise.all(requests)
      console.log(chalk.green('response >>>', JSON.stringify(responses[0])))

      console.log('\n-----------------------------------------------------------------')

      await sleep(PACE)
    }
    await sleep(PACE)
  }

  await end()
}

main()
