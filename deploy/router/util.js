const getFilterPreviewFn = parsedFilterBy => previewFile => {
  const { tags = [] } = previewFile
  console.log(tags, parsedFilterBy)
  return tags.some(tag => parsedFilterBy.indexOf(tag) >= 0)
}

module.exports = {
  getFilterPreviewFn
}