const express = require('express')
const zlib = require('zlib')
const got = require('got')
const sharp = require('sharp')
const { PassThrough } = require('stream')
const d3 = require('d3')

const { DS_SINGLE_PRV_KEY, APP_NAME } = require('../../constants')
const { getPreviewsHandler } = require('../getPreviews')
const { getSinglePreview } = require('../getSinglePreview')
const { store } = require('../../store')
const { weave } = require('../../common/weave')
const { queryToParamMiddleware } = require('../util')
const { getGzipSharpStream, setBufferToStore } = require('./util')

let LinearSvg, PolarSvg, parseFingerprint, parseReceptorMetadata, parseReceptorProfile
const mathjaxInitPr = require('mathjax').init({
  loader: {
    load: [ 'input/tex', 'output/svg' ]
  }
})
  .then(mathjax => {
    const w = weave(d3, mathjax, require('jsdom').JSDOM)
    LinearSvg = w['LinearSvg']
    PolarSvg = w['PolarSvg']
    parseFingerprint = w['parseFingerprint']
    parseReceptorMetadata = w['parseReceptorMetadata']
    parseReceptorProfile = w['parseReceptorProfile']
  })
  .catch(e => {
    console.error(e)
    throw new Error(`init mathjax error`)
  })

const router = express.Router()

const { createGzip } = zlib

const getStoreKey = ({ datasetId, filename }) => `[${APP_NAME}] [imagePipe] ${datasetId}:${filename}`

const getImageFromCache = async (req, res, next) => {
  const { datasetId, filename } = res.locals
  const result = await store.get(getStoreKey({ datasetId, filename }))

  if (result) {
    res.setHeader('Content-Encoding', 'gzip')
    res.setHeader('Content-Type', 'image/png')
    res.status(200).send(Buffer.from(result, 'base64'))
  } else {
    next()
  }
}

router.get('/',
  queryToParamMiddleware,
  getPreviewsHandler,
  getSinglePreview,
  getImageFromCache,
  async (req, res, next) => {

    const gzip = createGzip()
    
    const { datasetId, filename } = res.locals
    const singlePrv = res.locals[DS_SINGLE_PRV_KEY]
    if (!singlePrv) return next({
      message: `res.locals[DS_SINGLE_PRV_KEY] not populated`
    })
    const contexts = singlePrv['@context']

    const passThrough = new PassThrough()

    const buf = []
    passThrough.on('data', data => {
      buf.push(data)
    })

    passThrough.on('end', () => {
      if (buf.length === 0) return
      const totalBuffer = Buffer.concat(buf)
      const key = getStoreKey({ datasetId, filename })
      setBufferToStore(key, totalBuffer)
    })

    const { mimetype } = singlePrv

    if (mimetype.includes('image/tiff') || mimetype.includes('image/tif')) {
      const { url } = singlePrv
      let _url = url
      for (const key in contexts) {
        _url = _url.replace(`${key}:`, contexts[key])
      }

      res.setHeader('Content-Type', 'image/png')
      res.setHeader('Content-Encoding', 'gzip')

      const s = await getGzipSharpStream(_url)
      
      s.on('error', err => {
        res.status(500).send(err)
      })

      // getGzipSharpStream already caches
      // passthrough remains, for backwards compat reason
      s.pipe(res)

      /**
       * got fetching tiff does not seem to work on OKD. save to file with curl, then read from file instead
       */

      // got.stream(_url)
      //   .pipe(sharp().png())
      //   .pipe(gzip)
      //   .pipe(passThrough)
      //   .pipe(res)
      
      return
    }

    if (mimetype.includes('type=fingerprint')) {
      await mathjaxInitPr

      const { url } = singlePrv
      const context = singlePrv['@context']

      // metadata
      let _metadata_url = url['receptors.tsv']
      for (const key in context) {
        _metadata_url = _metadata_url.replace(`${key}:`, context[key])
      }
      const metadataReq = await got(_metadata_url)

      // TODO remove
      // temporary measure, replace \\alpha with \alpha
      const parsedMetadata = parseReceptorMetadata(
        metadataReq.body
          .replace(/\\\\alpha/g, `\\alpha`)
          .replace(/5-HT_1_A/g, '5-HT{_1}{_A}')
      )

      // fingerprint
      let _url = url['url']
      for (const key in context) {
        _url = _url.replace(`${key}:`, context[key])
      }
      const fpReq = await got(_url)

      // TODO remove
      // temporary measure, { was inserted instead of \t
      const replacedFpReqBody = fpReq.body.replace(/\{/g, '\t')

      const parsedFp = parseFingerprint(replacedFpReqBody)
      const pSvg = new PolarSvg(parsedFp)
      pSvg.setMetadata(parsedMetadata)
      
      const svg = pSvg.generateSvg()
      const svgBuffer = Buffer.from(svg)

      res.setHeader('Content-Type', 'image/png')
      res.setHeader('Content-Encoding', 'gzip')
      sharp(svgBuffer)
        .flatten({
          background: { r: 255, g: 255, b: 255 }
        })
        .png()
        .pipe(gzip)
        .pipe(passThrough)
        .pipe(res)

      return
    }

    if (mimetype.includes('type=profile')) {
      await mathjaxInitPr
      
      const { url } = singlePrv
      const context = singlePrv['@context']

      // fingerprint
      let _url = url['url']
      for (const key in context) {
        _url = _url.replace(`${key}:`, context[key])
      }
      const profileReq = await got(_url)

      // TODO remove
      // temporary measure, { was inserted instead of \t
      const replacedProfileReqBody = profileReq.body.replace(/\{/g, '\t')

      const parsedPr = parseReceptorProfile(replacedProfileReqBody)
      const corticalDepthLabel = parsedPr.columns[0].replace(/\s*\(.*?\)/, '')
      const corticalDepthUnit = parsedPr[0].corticalDepthUnit
      const receptorDensityLabel = parsedPr.columns[2].replace(/\s*\(.*?\)/, '')
      const receptorDensityUnit = parsedPr[0].densityUnit
      const config = {
        xAxis: {
          label: {
            text: `${corticalDepthLabel} (${corticalDepthUnit})`
          }
        },
        yAxis: {
          label: {
            text: `${receptorDensityLabel} (${receptorDensityUnit})`
          }
        }
      }

      const svgCls = new LinearSvg(parsedPr, config)
      const svg = svgCls.generateSvg()
      
      const svgBuffer = Buffer.from(svg)

      res.setHeader('Content-Type', 'image/png')
      res.setHeader('Content-Encoding', 'gzip')
      sharp(svgBuffer)
        .flatten({
          background: { r: 255, g: 255, b: 255 }
        })
        .png()
        .pipe(gzip)
        .pipe(passThrough)
        .pipe(res)

      return
    }
    
    passThrough.end()
    gzip.end()
    res.status(200).send('OK')
  }
)

module.exports = router
