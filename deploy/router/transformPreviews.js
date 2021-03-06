const { DS_PRV_KEY, APP_NAME } = require('../constants')
const { HOSTNAME = '' } = process.env

const convertPreview = ({ datasetId }) => ({ mimetype, ...rest }) => {
  const { filename } = rest
  const overwriteObj = {}
  if (mimetype.includes('application/kg-dataset-preview')) {
    if (mimetype.includes('type=fingerprint')) {
      overwriteObj['mimetype'] = 'image/png'
      overwriteObj['url'] = `getImagePipe?kgSchema=${encodeURIComponent('minds/core/dataset/v1.0.0')}&kgId=${encodeURIComponent(datasetId)}&filename=${encodeURIComponent(filename)}`
    }
    if (mimetype.includes('type=profile')) {
      overwriteObj['mimetype'] = 'image/png'
      overwriteObj['url'] = `getImagePipe?kgSchema=${encodeURIComponent('minds/core/dataset/v1.0.0')}&kgId=${encodeURIComponent(datasetId)}&filename=${encodeURIComponent(filename)}`
    }
    if (mimetype.includes('type=proxy')) {
      const re = /mimetype=([a-zA-Z0-9\/]+)/.exec(mimetype)
      if (re) {
        overwriteObj['mimetype'] = re[1]
      } else {
        overwriteObj['mimetype'] = 'application/octet-stream'
      }
      overwriteObj['url'] = `${HOSTNAME}proxy?kgSchema=${encodeURIComponent('minds/core/dataset/v1.0.0')}&kgId=${encodeURIComponent(datasetId)}&filename=${encodeURIComponent(filename)}`
    }
  } else {
    if (mimetype.includes('image/tiff') || mimetype.includes('image/tif')) {
      overwriteObj['mimetype'] = 'image/png'
      overwriteObj['url'] = `getImagePipe?kgSchema=${encodeURIComponent('minds/core/dataset/v1.0.0')}&kgId=${encodeURIComponent(datasetId)}&filename=${encodeURIComponent(filename)}`
    }
  }
  return {
    ...rest,
    mimetype,
    ...overwriteObj
  }
}

const transformPreviews = (req, res, next) => {
  /**
   * filename may be not defined!
   */
  const { datasetId, filename } = req.params
  const arr = res.locals[DS_PRV_KEY]
  if (!arr) return next(`[${APP_NAME}] [transformPreviews.js] res.locals[DS_PRV_KEY] falsy!`)
  const convertedArr = arr.map(convertPreview({ datasetId, filename }))
  res.locals[DS_PRV_KEY] = convertedArr
  next()
}

exports.transformPreviews = transformPreviews
