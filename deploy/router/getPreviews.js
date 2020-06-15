const fs = require('fs')
const path = require('path')
const { store } = require('../store')
const { DS_PRV_KEY, APP_NAME } = require('../constants')
const {
  MOUNTED_DATA_PREVIEW_DRIVE,
} = process.env

if (!MOUNTED_DATA_PREVIEW_DRIVE) throw new Error(`MOUNTED_DATA_PREVIEW_DRIVE env var needs to be defined to render data`)

/**
 * let store deal with cache invalidation
 * getDatasetFilePreviews will always return a cached version, if exists
 */
const getDatasetFilePreviews = id => new Promise(async (rs, rj) => {

  const getStoreId = _id => `[${APP_NAME}] [ds-prv] ${_id}`
  const _id = getStoreId(id)

  const cachedData = await store.get(_id)
  if (cachedData) {
    const parsedData = JSON.parse(cachedData)
    return rs(parsedData)
  }
  fs.readFile(path.resolve(MOUNTED_DATA_PREVIEW_DRIVE, id), 'utf-8', (err, data) => {
    if (err) {
      console.warn(`[${APP_NAME}] getPreviewsHandler.js #getDatasetFilePreviews`, err)
      return rj(err)
    }

    const parsedData = JSON.parse(data)
    rs(parsedData)
    store.set(_id, data)
  })
})

const getPreviewsHandler = async (req, res, next) => {
  const { datasetId } = req.params
  if (!datasetId) return next(`datasetId must be defined! But instead got: ${datasetId}`)

  try {
    const arr = await getDatasetFilePreviews(datasetId)
    res.locals[DS_PRV_KEY] = arr
    next()
  } catch (err) {
    console.warn(`[${APP_NAME}] [getPreview.js] refreshing ${datasetId} error!`, err)
    next(err)
  }
}

exports.getPreviewsHandler = getPreviewsHandler
exports.getDatasetFilePreviews = getDatasetFilePreviews
