const getFilterPreviewFn = parsedFilterBy => previewFile => {
  const { tags = [] } = previewFile
  return tags.some(tag => parsedFilterBy.indexOf(tag) >= 0)
}

module.exports = {
  getFilterPreviewFn
}