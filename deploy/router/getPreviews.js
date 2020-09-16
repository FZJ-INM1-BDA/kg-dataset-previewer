const fs = require('fs')
const path = require('path')
const { store } = require('../store')
const { DS_PRV_KEY, APP_NAME } = require('../constants')
const { promisify } = require('util')
const asyncReaddir = promisify(fs.readdir)
const {
  MOUNTED_DATA_PREVIEW_DRIVE,
} = process.env

if (!MOUNTED_DATA_PREVIEW_DRIVE) throw new Error(`MOUNTED_DATA_PREVIEW_DRIVE env var needs to be defined to render data`)

/**
 * let store deal with cache invalidation
 * getDatasetFilePreviews will always return a cached version, if exists
 */
const getDatasetFilePreviews = ({ datasetId: id, datasetSchema = 'minds/core/dataset/v1.0.0' }) => new Promise(async (rs, rj) => {

  const getStoreId = (_schema, _id) => `[${APP_NAME}] [ds-prv] ${_schema} ${_id}`
  const _id = getStoreId(datasetSchema, id)

  const cachedData = await store.get(_id)
  if (cachedData) {
    const parsedData = JSON.parse(cachedData)
    return rs(parsedData)
  }
  fs.readFile(path.join(MOUNTED_DATA_PREVIEW_DRIVE, datasetSchema.replace(/\//g, '_') , id), 'utf-8', (err, data) => {
    if (err) {
      /**
       * if file does not exist, resolve empty array
       */
      if (err.code === 'ENOENT') return rs([])
      else return rj(err)
    }

    const parsedData = JSON.parse(data)
    rs(parsedData)
    store.set(_id, data)
  })
})

const getPreviewsHandler = async (req, res, next) => {
  const datasetId = req.params['datasetId'] || res.locals['datasetId']
  const datasetSchema = req.params['datasetSchema'] || res.locals['datasetSchema']
  if (!datasetId) return next(`datasetId must be defined! But instead got: ${datasetId}`)

  try {
    const arr = await getDatasetFilePreviews({ datasetId, datasetSchema })
    res.locals[DS_PRV_KEY] = arr
    next()
  } catch (err) {
    console.warn(`[${APP_NAME}] [getPreview.js] refreshing ${datasetId} error!`, err)
    next(err)
  }
}

const getAllDsPreviews = async () => {
  const returnArr = []

  const dirs = await asyncReaddir(MOUNTED_DATA_PREVIEW_DRIVE)
  for (const dir of dirs) {
    const files = await asyncReaddir(path.join(MOUNTED_DATA_PREVIEW_DRIVE, dir))
    for (const f of files) {
      returnArr.push(
        `${dir.replace(/_/g, '/')}/${encodeURIComponent(f)}`
      )
    }
  }
  return returnArr
}

exports.getAllDsPreviews = getAllDsPreviews
exports.getPreviewsHandler = getPreviewsHandler
exports.getDatasetFilePreviews = getDatasetFilePreviews
