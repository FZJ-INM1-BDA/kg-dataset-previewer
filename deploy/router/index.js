const express = require('express')
const fs = require('fs')
const path = require('path')
const pathToPreviewData = path.resolve(__dirname, '../data/shapedPreviewData.json')

let list = []
fs.readFile(pathToPreviewData, 'utf-8', (err, data) => {
  if (err) throw err
  const arr = JSON.parse(data)
  for (const [key, val] of arr){
    datasetMap.set(key, val)
  }
  list = Array.from(datasetMap.keys())
})

const datasetMap = new Map()

const router = express.Router()

const getFiles = ({ datasetId }) => datasetMap.get(datasetId)

router.use('/data/receptor', express.static(
  path.join(__dirname, '../data/receptor')
))

router.get('/:datasetId/:qFilename', (req, res) => {
  const { datasetId, qFilename } = req.params
  const files = getFiles({ datasetId })
  if (!files) return res.status(404).end()
  const file = files.find(({ filename }) => filename === qFilename)
  if (file) return res.status(200).json(file)
  return res.status(404).end()
})

router.get('/:datasetId', (req, res) => {
  const { datasetId } = req.params
  const r = getFiles({ datasetId })
  if (r) res.status(200).json(r)
  else res.status(404).end()
})

router.get('/', (req, res) => {
  res.status(200).json(list)
})

module.exports = router