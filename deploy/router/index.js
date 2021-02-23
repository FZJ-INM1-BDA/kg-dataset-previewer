const express = require('express')
const path = require('path')
const got = require('got')
const { pipeline } = require('stream')
const { getFilterPreviewFn, queryToParamMiddleware } = require('./util')
const { DS_PRV_KEY, DS_SINGLE_PRV_KEY } = require('../constants')
const { getPreviewsHandler, getAllDsPreviews } = require('./getPreviews')
const { transformPreviews } = require('./transformPreviews')
const { getSinglePreview } = require('./getSinglePreview')

const router = express.Router()

router.use('/data/receptor', express.static(
  path.join(__dirname, '../data/receptor')
))

const getCacheCtrl = ({ minute=1, hour=0, day=0 } = {}) => (_req, res, next) => {
  const timeInS = day * 24 * 60 * 60 +
    hour * 60 * 60 +
    minute * 60
  res.setHeader('Cache-Control', `max-age=${timeInS}`)
  next()
}

const oneMinCache = getCacheCtrl()

// used exclusive for debugging dumb components
router.get('/_bs', async (_req, res) => {
  try {

    const { body } = await got(`https://brainscapes.apps-dev.hbp.eu/features/ReceptorDistribution?region=hoc1`, {
      headers: {
        'Authorization': `Bearer ${process.env.HBP_ACCESS_TOKEN}`
      }
    })

    res.setHeader('content-type', 'application/json')
    res.status(200).send(body)
  } catch(e) {
    res.status(500).end()
  }
})

router.use('/imageProxy', oneMinCache, require('./image/imageProxy'))
router.use('/getImagePipe', oneMinCache, require('./image/getImagePipe'))

router.use('/proxy',
  oneMinCache,
  queryToParamMiddleware,
  getPreviewsHandler,
  getSinglePreview,
  (req, res) => {
    const singlePrv = res.locals[DS_SINGLE_PRV_KEY]
    const { url } = singlePrv
    res.setHeader('Content-type', 'application/octet-stream')
    pipeline(
      got.stream(url),
      res,
      err => {
        if (err) res.status(500).end()
      }
    )
  }
)

router.get('/raw/:datasetSchema/:datasetId/:filename',
  getPreviewsHandler,
  getSinglePreview,
  (req, res) => {
    const { returnOk } = req.query
    const returnObj = res.locals[DS_SINGLE_PRV_KEY]
    if (returnObj || returnOk) {
      return res.status(200).json(
        returnObj || { error: 'Not found' }
      )
    } else {
      return res.status(404).send(`Not found`)
    }
  }
)

router.get('/raw_proxy_data/:datasetSchema/:datasetId/:filename',
  getPreviewsHandler,
  getSinglePreview,
  async (req, res, next) => {
    const returnObj = res.locals[DS_SINGLE_PRV_KEY]
    if (returnObj['mimetype'] === 'image/tiff') {
      const { datasetSchema, datasetId, filename } = req.params
      returnObj['data'] = {
        image: {
          url: `getImagePipe?kgSchema=${encodeURIComponent(datasetSchema)}&kgId=${encodeURIComponent(datasetId)}&filename=${encodeURIComponent(filename)}`,
          mimetype: 'image/png'
        }
      }
      return next()
    }
    const { ["@context"]: context, url } = returnObj
    returnObj['data'] = {}
    for (const key in url) {
      const urlToFetch = url[key]
      for (const ctx in context) {
        const contextedUrl = urlToFetch.replace(`${ctx}:`, context[ctx])
        const { body } = await got(contextedUrl)
        returnObj['data'][key] = body
          .replace(/\{/g, '\t')
          .replace(/\\\\alpha/g, `\\alpha`)
          .replace(/5-HT_1_A/g, '5-HT{_1}{_A}')
          .replace(/\$5-HT_\t1A}\$/, '$5-HT{_1}{_A}$')
      }
    }
    next()
  },
  (req, res) => {
    const { returnOk } = req.query
    const returnObj = res.locals[DS_SINGLE_PRV_KEY]
    if (returnObj || returnOk) {
      return res.status(200).json(
        returnObj || { error: 'Not found' }
      )
    } else {
      return res.status(404).send(`Not found`)
    }
  }
)

router.get('/:datasetSchema/:datasetId/:filename',
  getPreviewsHandler,
  transformPreviews,
  getSinglePreview,
  oneMinCache,
  (req, res) => {
    const singlePrev = res.locals[DS_SINGLE_PRV_KEY]
    if (!singlePrev) res.status(404).end()
    else res.status(200).json(singlePrev)
  }
)

router.get('/:datasetSchema/:datasetId',
  getPreviewsHandler,
  transformPreviews,
  oneMinCache,
  (req, res) => {
    const { filterBy } = req.query

    let parsedFilterBy
    try {
      parsedFilterBy = filterBy && JSON.parse(filterBy)
    } catch (e) {
      return res.status(400).send(`filterBy needs to be URL encoded array of strings`)
    }

    const r = res.locals[DS_PRV_KEY]
    if (!r) return res.status(404).end()

    if (!filterBy) return res.status(200).json(r)
    res.status(200).json(
      r.filter(getFilterPreviewFn(parsedFilterBy))
    )
  }
)

router.get('/',
  oneMinCache,
  async (_req, res) => {
    const allPrevs = await getAllDsPreviews()
    res.status(200).json(allPrevs)
  }
)

router.delete('/', require('./clearCache'))

module.exports = router