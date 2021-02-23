const tmp = require('tmp')
const zlib = require('zlib')
const { exec } = require('child_process')
const { PassThrough, Readable } = require('stream')
const sharp = require('sharp')
const { APP_NAME } = require('../../constants')
const fs = require('fs')
const { store } = require('../../store')
const MODULE_NAME = `[image/util]`

const getStoreKey = key => `${APP_NAME}${MODULE_NAME}${key}`

const { createGzip } = zlib

const getBufferFromStore = async key => {
  const result = await store.get(key)
  if (result) {
    return Buffer.from(result, 'base64')
  }
  
  return null
}

const setBufferToStore = async (key, val) => {
  if (!(val instanceof Buffer)) {
    throw new Error(`val needs to be an instance of buffer!`)
  } else {
    await store.set(key, val.toString('base64'))
  }
}

const getGzipSharpStream = url => new Promise((rs, rj) => {
  tmp.file({ postfix: '.tif' }, async (err, filePath, fd, cleancb) => {
    if (err) {
      console.error(`[${APP_NAME}] generating temp file error`, err)
      res.status(500).send(err)
      return
    }
    const key = getStoreKey(url)
    const content = await getBufferFromStore(key)
    if (content) {
      const r = new Readable()
      rs(r)
      r.push(content)
      r.push(null)
      return 
    }

    exec(`curl -o ${filePath} '${url}'`, (err, stdout, stderr) => {
      if (err) {
        console.error(err)
        return rj(err)
      }

      const gzip = createGzip()

      const passThrough = new PassThrough()
      const buf = []
      passThrough.on('data', data => {
        buf.push(data)
      })
  
      passThrough.on('end', () => {
        if (buf.length === 0) return
        const totalBuffer = Buffer.concat(buf)
        setBufferToStore(key, totalBuffer)
      })

      const s = sharp(filePath)
        .png()
        .pipe(gzip)
        .pipe(passThrough)

      s.on('finish', () => {
        fs.unlink(filePath, () => cleancb())
      })
      
      rs(s)
    })
  })

})

exports.setBufferToStore = setBufferToStore
exports.getBufferFromStore = getBufferFromStore
exports.getGzipSharpStream = getGzipSharpStream
