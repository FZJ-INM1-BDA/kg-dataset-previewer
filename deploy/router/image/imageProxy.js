const router = require('express').Router()
const { getGzipSharpStream } = require('./util')

const V1_URL = `https://object.cscs.ch/v1`

router.get('/v1', async (req, res) => {
  const { u } = req.query
  // deliberately do not do any path.join, to prevent path traversal
  const _url = `${V1_URL}${u}`

  res.setHeader('Content-Type', 'image/png')
  res.setHeader('Content-Encoding', 'gzip')
  const s = await getGzipSharpStream(_url)
  s.on('error', err => {
    res.status(500).send(err)
  })
  s.pipe(res)
})


module.exports = router
