/**
 * Cache to allow for in memory response while data fetching/processing occur
 */

const { 
  REDIS_PROTO,
  REDIS_ADDR,
  REDIS_PORT,

  REDIS_RATE_LIMITING_DB_EPHEMERAL_PORT_6379_TCP_PROTO,
  REDIS_RATE_LIMITING_DB_EPHEMERAL_PORT_6379_TCP_ADDR,
  REDIS_RATE_LIMITING_DB_EPHEMERAL_PORT_6379_TCP_PORT,

  REDIS_USERNAME,
  REDIS_PASSWORD,

} = process.env

const redisProto = REDIS_PROTO || REDIS_RATE_LIMITING_DB_EPHEMERAL_PORT_6379_TCP_PROTO || 'redis'
const redisAddr = REDIS_ADDR || REDIS_RATE_LIMITING_DB_EPHEMERAL_PORT_6379_TCP_ADDR || null
const redisPort = REDIS_PORT || REDIS_RATE_LIMITING_DB_EPHEMERAL_PORT_6379_TCP_PORT || 6379

const userPass = `${REDIS_USERNAME || ''}${( REDIS_PASSWORD && (':' + REDIS_PASSWORD)) || ''}${ (REDIS_USERNAME || REDIS_PASSWORD) && '@'}`

const redisURL = redisAddr && `${redisProto}://${userPass}${redisAddr}:${redisPort}`

const ensureString = val => {
  if (typeof val !== 'string') throw new Error(`both key and val must be string`)
}

if (redisURL) {
  const redis = require('redis')
  const { promisify } = require('util')
  const client = redis.createClient({
    url: redisURL
  })

  const asyncGet = promisify(client.get).bind(client)
  const asyncSet = promisify(client.set).bind(client)

  exports.store = {
    set: async (key, val) => {
      ensureString(key)
      ensureString(val)
      asyncSet(key, val)
    },
    get: async (key) => {
      ensureString(key)
      return asyncGet(key)
    }
  }

  exports.StoreType = `redis`

} else {
  const LRU = require('lru-cache')
  const store = new LRU({
    max: 128 * 1024 * 1024, // 128mb
    length: (n, key) => n.length,
    maxAge: Infinity, // never expires
  })

  exports.store = {
    set: async (key, val) => {
      ensureString(key)
      ensureString(val)
      store.set(key, val)
    },
    get: async (key) => {
      ensureString(key)
      return store.get(key)
    }
  }

  exports.StoreType = `lru-cache`
}
