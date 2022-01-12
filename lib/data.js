'use strict'

const db = require('../db')

// NOTE for educational purposes only

function getGroupsByUserId (id) {
  const userGroups = []
  for (const [groupId, group] of Object.entries(db.groups)) {
    if (group.users.includes(id)) {
      userGroups.push(Number(groupId))
    }
  }
  return userGroups
}

module.exports = {
  getGroupsByUserId
}
