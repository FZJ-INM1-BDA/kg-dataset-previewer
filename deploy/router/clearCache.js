const express = require('express')
const router = express.Router()
const { store } = require('../store')

const { 
  APPLICATION_NAME,
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

const redisURL = null && redisAddr && `${redisProto}://${userPass}${redisAddr}:${redisPort}`

const RateLimit = require('express-rate-limit')
const RedisStore = require('rate-limit-redis')

/**
 * one attempt every second
 */
const limiter = new RateLimit({
  windowMs: 1e3 * 5,
  max: 1,
  ...( redisURL ? { store: new RedisStore({ redisURL }) } : {} )
})

router.use(limiter, async (req, res) => {
  const xForwardedFor = req.headers['x-forwarded-for']
  const token = req.headers['authorization']
  const auth = token && token.replace(/^token\s/i, '')
  const ip = req.connection.remoteAddress
  console.log({
    type: 'clear cache request',
    method: 'DELETE /',
    xForwardedFor: xForwardedFor && xForwardedFor.replace(/\ /g, '').split(','),
    ip,
    auth
  })

  try {
    await store.clear(auth)
    res.status(200).end()
  } catch (e) {
    console.error(`clear cache failed`)
    res.status(200).end()
  }
})

module.exports = router
