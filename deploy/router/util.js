const getFilterPreviewFn = parsedFilterBy => previewFile => {
  const { tags = [] } = previewFile
  return tags.some(tag => parsedFilterBy.indexOf(tag) >= 0)
}

const queryToParamMiddleware = (req, res, next) => {
  const { kgSchema, kgId, filename } = req.query
  res.locals.datasetId = kgId
  res.locals.filename = filename
  res.locals.datasetSchema = kgSchema
  next()
}

module.exports = {
  getFilterPreviewFn,
  queryToParamMiddleware,
}
