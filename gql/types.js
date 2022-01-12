'use strict'

const typeDefs = `
  type User {
    id: ID!
    name: String!
    groups: [Group!]
    country: Country
  }

  type Group {
    id: ID!
    name: String!
    users: [User!]
  }

  type Country {
    id: ID!
    name: String!
  }

  type Query {
    user(id: ID!): User
    users(page: Int, size: Int): [User!]!

    group(id: ID!): Group
    groups(page: Int, size: Int): [Group!]!

    country(id: ID!): Country
    countries: [Country!]!
  }

  input UserInput {
    name: String!,
    country: ID!
  }

  input GroupInput {
    name: String!
  }

  type Mutation {
    addUser (user: UserInput!): User!
    updateUser (id: ID!, user: UserInput!): User!
    removeUser (id: ID!): ID!

    addGroup (group: GroupInput!): Group!
    updateGroup (id: ID!, group: GroupInput!): Group!
    removeGroup (id: ID!): ID!

    addUserToGroup (userId: ID!, groupId: ID!): Group!
    removeUserFromGroup (userId: ID!, groupId: ID!): Group!
  }
`

module.exports = typeDefs
