# mercurius-cache-example

A non-trivial example of caching and invalidation with [mercurius](https://github.com/mercurius-js/mercurius) and [mercurius-cache](https://github.com/mercurius-js/cache)

## Introduction

This small yet complex application's purpose is to show a practical example of `mercurius` caching and invalidation.

It uses the advanced options provided by the `mercurius-cache` module: caching (of course), `redis` storage, and `garbage collection` use and invalidation by `references`.

---

## The application

The application has 3 entities: `User`, `Group`, and `Country`.

`Country` is a read-only static entity, `User` and `Group` have typical read and write queries and mutations.

Any `User` may belong to some `Group`s, so we have these GraphQL types

```gql
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
```

We want to avoid time-based invalidation and apply event invalidation, so essentially we cache the queries when they are called and we invalidate (remove cached entries) them when their content has changed by a mutation.
Anyway, all the entries last a maximum of 1 day (86400 seconds) to be sure to flush unused entries.

## Time-based invalidation vs Event invalidation

Invalidation by TTL is good but is not precise.  

The TTL says the exact amount of time cached entries last; this leads to delay data refresh and unnecessary refreshes of an entry. It's also hard to find and an arbitrary value for entities TTL.  

So, we have user `{id: 1, name: "Alice"}` with cache TTL 60 seconds.
We get a request to it, so we cache. After 10 seconds, we get an update to `{id: 1, name: "Anna" }` but for the remaining 50 seconds, we will serve the cached entry `{id: 1, name: "Alice"}` even if this value is outdated.

Or the value of the entry `{id: 1, name: "Alice"}` does not change all day long, but we keep refreshing it every 60 seconds.

What we want to achieve it's pretty obvious. We want to cache the entry the first time it's queried then we want to refresh it only when and if it changes, by a writing event.  

## Mercurius cache invalidation

That's exactly the principle behind `mercurius-cache` invalidation.  
While `ttl` invalidation is supported, event invalidation is implemented through `references`

`references` are auxiliary information to implicitly link cached entries to each other.  
So, when we resolve a query, we also add `references` to the entry, for example

```js
app.register(require('mercurius-cache'), {
  policy: {
    Query: {
      user: {
        references: (request, key, result) => {
          if (!result) { return }
          return [`user:${result.id}`]
        }
      },
```

we way that the resolver of `query { user (id: 1) }` has also the `user:1` reference (can be more than one, for example for lists).

Now we have the information to invalidate the cached result of the previous query when the `user:1` changed, like

```js
  Mutation: {
    updateUser: {
      invalidate: (self, arg, ctx, info, result) => [`user:${arg.id}`]
    },
```

so, when `mutation { updateUser(id: 1, user: { name: "John" }) }` runs, `invalidate` function is triggered and _all_ the entries associated to `user:1` are invalidated, whenever they are.  

See the code in [plugins/cache.js](./plugins/cache.js)

## Storages

We can use different storage for different purposes.  
At the moment, `async-cache-dedupe` supports `redis` and `memory` storages - `async-cache-dedupe` is the core module under `mercurius-cache` hood.  
In-memory storage fits best with small data set, for example here `Country` queries.  
Don't need to say `redis` is **the** caching database, so for large and/or shared data, it's the best choice.
We need to consider `memory` storage is about 10x performant than `redis`, but of course, they are part of the node process running the application.  

## Redis Garbage Collector

Because `redis` has its own expiration, we need to run `gc` over `references`.  
While the garbage collector is optional, is highly recommended to keep references up to date and improve performances on setting cache entries and invalidation of them.  
See [async-cache-dedupe#redis-garbage-collector](https://github.com/mcollina/async-cache-dedupe#redis-garbage-collector) for details.  
See the example in [plugins/cache.js](./plugins/cache.js) about how to run `gc` on a single instance service.  

## Report

`mercurius-cache` has a report for stats about cache use: it's very important to observe how the cache behaves to fine-tune its use.  
See [mercurius-cache logInterval and logReport](https://github.com/mercurius-js/cache) for details.

---

## How to

### Setup and start the application

```bash
docker-compose up -d
npm i
node index.js
```

### Run the simulation

In `simulation/app` there is a simulation of common scenarios, with verbose logs, run `node simulation/app` to see what happens!

Or just watch the simulation here https://asciinema.org/a/461438

---

## License

MIT
