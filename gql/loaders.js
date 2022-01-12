'use strict'

const db = require('../db')
const { getGroupsByUserId } = require('../lib/data')

const loaders = {
  User: {
    groups: async (queries, context) => {
      return queries.map(user =>
        getGroupsByUserId(Number(user.obj.id)).map(id =>
          ({ id, ...db.groups[id] })))
    }
  },

  Group: {
    users: async (queries, context) => {
      return queries.map(group =>
        group.obj.users.map(id =>
          ({ id, ...db.users[id] })))
    }
  }
}

module.exports = loaders
