'use strict'

const fp = require('fastify-plugin')
const { createStorage } = require('async-cache-dedupe')

module.exports = fp(async (app, options) => {
  app.register(require('mercurius-cache'), {
    ttl: options.cache.ttl,
    storage: { type: 'redis', options: { client: app.redis, invalidation: true } },
    policy: {
      Query: {
        user: {
          // references: the user by id
          references: (request, key, result) => {
            if (!result) { return }
            return [`user:${result.id}`]
          }
        },
        users: {
          // references: the users by id and the users list
          // it means, we want to invalidate all the pages at once
          // because it's to expensive syncing users and pages (and usually there filtering and sorting too!)
          // but page 1 worth to keep synced, because it's called often
          references: ({ arg }, key, result) => {
            if (!result) { return }
            const references = result.map(user => (`user:${user.id}`))
            if (arg.page === 1) {
              references.push('users:1')
            } else {
              references.push('users')
            }
            return references
          }
        },
        group: {
          // references: the group by id
          references: (request, key, result) => {
            if (!result) { return }
            return [`group:${result.id}`]
          }
        },
        groups: {
          // references: the groups by id and the groups list, same as users
          references: (request, key, result) => {
            if (!result) { return }
            const references = result.map(group => (`group:${group.id}`))
            references.push('groups')
            return references
          }
        },

        // use the in-memory storage for countries, because they are small and static
        countries: {
          ttl: 86400,
          storage: { type: 'memory' }
        },
        country: {
          ttl: 86400,
          storage: { type: 'memory' }
        }
      },
      Mutation: {
        addUser: {
          // invalidate the user pages, because it may includes now the new user
          invalidate: (self, arg, ctx, info, result) => ['users', 'users:1']
        },
        updateUser: {
          // invalidate the user and cascade invalidate user pages and groups involving it
          invalidate: (self, arg, ctx, info, result) => [`user:${arg.id}`]
        },
        removeUser: {
          // invalidate the user and cascade invalidate user pages and groups involving it
          invalidate: (self, arg, ctx, info, result) => [`user:${arg.id}`]
        },
        // same as user mutations
        addGroup: {
          invalidate: (self, arg, ctx, info, result) => ['groups']
        },
        updateGroup: {
          invalidate: (self, arg, ctx, info, result) => [`group:${arg.id}`]
        },
        removeGroup: {
          invalidate: (self, arg, ctx, info, result) => [`group:${arg.id}`]
        },
        addUserToGroup: {
          invalidate: (self, arg, ctx, info, result) => [`group:${arg.groupId}`, `user:${arg.userId}`]
        },
        removeUserFromGroup: {
          invalidate: (self, arg, ctx, info, result) => [`group:${arg.groupId}`, `user:${arg.userId}`]
        }
      }
    },
    onDedupe: function (type, fieldName) {
      app.log.info({ msg: 'deduping', type, fieldName })
    },
    onHit: function (type, fieldName) {
      app.log.info({ msg: 'hit from cache', type, fieldName })
    },
    onMiss: function (type, fieldName) {
      app.log.info({ msg: 'miss from cache', type, fieldName })
    },
    onSkip: function (type, fieldName) {
      app.log.info({ msg: 'skip cache', type, fieldName })
    },

    // caching stats
    logInterval: options.cache.logInterval,
    logReport: (report) => {
      app.log.info({ msg: 'cache stats' })
      console.table(report)
    }
  })

  // garbage collector

  let gcIntervalLazy, gcIntervalStrict
  let cursor = 0
  const storage = createStorage('redis', { client: app.redis, invalidation: true })

  app.addHook('onReady', async () => {
    gcIntervalLazy = setInterval(async () => {
      // note gc function does not throw on error
      app.log.info({ msg: 'running garbage collector (lazy)' })
      const report = await storage.gc('lazy', { lazy: { chunk: options.cache.gc.lazyChunk, cursor }})
      if (report.error) {
        app.log.error({ msg: 'error running gc', mode: 'lazy', report })
        return
      }
      app.log.info({ msg: 'gc report', mode: 'lazy', report })
      cursor = report.cursor
    }, options.cache.gc.lazyInterval).unref()

    gcIntervalStrict = setInterval(async () => {
      // note gc function does not throw on error
      app.log.info({ msg: 'running garbage collector (strict)' })
      const report = await storage.gc('strict', { chunk: options.cache.gc.chunk })
      if (report.error) {
        app.log.error({ msg: 'error running gc', mode: 'strict', report })
        return
      }
      app.log.info({ msg: 'gc report', mode: 'strict', report })
    }, options.cache.gc.strictInterval).unref()
  })

  app.addHook('onClose', async () => {
    clearInterval(gcIntervalLazy)
    clearInterval(gcIntervalStrict)
  })
}, {
  name: 'mercurius-cache',
  dependencies: ['mercurius', 'redis']
})
