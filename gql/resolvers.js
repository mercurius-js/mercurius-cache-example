'use strict'

const db = require('../db')
const { promisify } = require('util')
const { getGroupsByUserId } = require('../lib/data')
const sleep = promisify(setTimeout)

const resolvers = {
  Query: {
    async user (_, { id }) {
      id = Number(id)
      // simulate a slow query
      await sleep(500)
      return db.users[id] ? { id, ...db.users[id] } : null
    },

    async users (_, { page = 1, size = 3 }) {
      page = Math.max(1, Math.min(Object.keys(db.users).length, page))
      size = Math.max(1, Math.min(100, size))

      return Object.entries(db.users)
        .slice((page - 1) * size, page * size)
        .map(([id, user]) => ({ id, ...user }))
    },

    async group (_, { id }) {
      return db.groups[id] ? { id, ...db.groups[id] } : null
    },

    async groups (_, { page = 1, size = 3 }) {
      page = Math.max(1, Math.min(Object.keys(db.groups).length, page))
      size = Math.max(1, Math.min(100, size))

      return Object.entries(db.groups)
        .slice((page - 1) * size, page * size)
        .map(([id, group]) => ({ id, ...group }))
    },

    async country (_, { id }) {
      return db.countries[id] ? { id, ...db.countries[id] } : null
    },

    async countries () {
      return Object.entries(db.countries).map(([id, { name }]) => ({ id, name }))
    }

  },

  Mutation: {
    addUser (_, { user: { name, country } }) {
      const id = Math.max(...Object.keys(db.users).map(id => Number(id))) + 1
      db.users[id] = { name, country }
      return { id, name, country }
    },
    addGroup (_, { group: { name } }) {
      const id = Math.max(...Object.keys(db.groups).map(id => Number(id))) + 1
      db.groups[id] = { name, users: [] }
      return { id, ...db.groups[id] }
    },
    updateUser (_, { id, user: { name, country } }) {
      db.users[id] = { name, country }
      return { id, name, country }
    },
    updateGroup (_, { id, user: { name } }) {
      db.groups[id] = { name }
      return { id, ...db.groups[id] }
    },
    removeUser (_, { id }) {
      id = Number(id)
      getGroupsByUserId(id).forEach(groupId => {
        const group = db.groups[groupId]
        group.users.splice(group.users.indexOf(id), 1)
      })
      delete db.users[id]
      return id
    },
    removeGroup (_, { id }) {
      delete db.groups[id]
      return id
    },
    addUserToGroup (_, { userId, groupId }) {
      userId = Number(userId)
      const group = db.groups[groupId]
      if (!group.users.includes(userId)) {
        group.users.push(userId)
      }
      return { id: groupId, ...group }
    },
    removeUserFromGroup (_, { userId, groupId }) {
      userId = Number(userId)
      const group = db.groups[groupId]
      group.users.splice(group.users.indexOf(userId), 1)
      return { id: groupId, ...group }
    }
  },

  User: {
    __resolveReference: (source, args, context, info) => {
      return db.users[source.id]
    },
    country: (user, args, context, info) => {
      return db.countries[user.country] ? { id: user.country, ...db.countries[user.country] } : null
    }
  },

  Group: {
    __resolveReference: (source, args, context, info) => {
      return db.groups[source.id]
    }
  },

  Country: {
    __resolveReference: (source, args, context, info) => {
      return db.countries[source.id]
    }
  }
}

module.exports = resolvers
