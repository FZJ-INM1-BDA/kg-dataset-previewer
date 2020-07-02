const { DS_PRV_KEY, DS_SINGLE_PRV_KEY } = require('../constants')

const getSinglePreview = async (req, res, next) => {
  const { filename: qFilename } = req.params
  const arr = res.locals[DS_PRV_KEY]
  const item = arr.find(({ filename }) => filename === qFilename)
  res.locals[DS_SINGLE_PRV_KEY] = item
  next()
}

exports.getSinglePreview = getSinglePreview
