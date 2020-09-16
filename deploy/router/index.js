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

router.use('/getImagePipe', oneMinCache, require('./getImagePipe'))

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