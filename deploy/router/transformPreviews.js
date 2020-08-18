const { DS_PRV_KEY, APP_NAME } = require('../constants')

const convertPreview = ({ datasetId, filename }) => ({ mimetype, ...rest }) => {
  const overwriteObj = {}
  if (mimetype.includes('application/kg-dataset-preview')) {
    if (mimetype.includes('type=fingerprint')) {
      overwriteObj['mimetype'] = 'image/png'
      overwriteObj['url'] = `getImagePipe?kgSchema=${encodeURIComponent('minds/core/dataset/v1.0.0')}&kgId=${encodeURIComponent(datasetId)}&filename=${encodeURIComponent(filename)}&type=fingerprint`
    }
    if (mimetype.includes('type=profile')) {
      overwriteObj['mimetype'] = 'image/png'
      overwriteObj['url'] = `getImagePipe?kgSchema=${encodeURIComponent('minds/core/dataset/v1.0.0')}&kgId=${encodeURIComponent(datasetId)}&filename=${encodeURIComponent(filename)}&type=profile`
    }
  }
  if (mimetype.includes('image/tiff') || mimetype.includes('image/tif')) {
    overwriteObj['mimetype'] = 'image/png'
    overwriteObj['url'] = `getImagePipe?kgSchema=${encodeURIComponent('minds/core/dataset/v1.0.0')}&kgId=${encodeURIComponent(datasetId)}&filename=${encodeURIComponent(filename)}&type=tiff`
  }
  return {
    ...rest,
    mimetype,
    ...overwriteObj
  }
}

const transformPreviews = (req, res, next) => {
  const { datasetId, filename } = req.params
  const arr = res.locals[DS_PRV_KEY]
  if (!arr) return next(`[${APP_NAME}] [transformPreviews.js] res.locals[DS_PRV_KEY] falsy!`)
  const convertedArr = arr.map(convertPreview({ datasetId, filename }))
  res.locals[DS_PRV_KEY] = convertedArr
  next()
}

exports.transformPreviews = transformPreviews
