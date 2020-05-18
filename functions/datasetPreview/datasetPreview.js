const fs = require('fs')

exports.handler = (ev, ctx, cb) => {
  const {
    path,
    httpMethod,
    headers,
    queryStringParameters,
    body,
    isBase64Encoded,
  } = ev

  // looks like one does not need filter by fn
  //
  // const {
  //   filterBy
  // } = queryStringParameters

  // let parsedFilterBy
  // try {
  //   parsedFilterBy = filterBy && JSON.parse(filterBy)
  // } catch (e) {
  //   return cb(null, { status: 400 })
  // }

  const re0 = /datasetPreview\/(.+)/.exec(path)
  if (!re0) {
    return cb(null, {
      status: 401
    })
  }
  const fullReq = re0[1]
  const re1 = /^([0-9a-f-]+)(\/.+)?$/.exec(fullReq)
  if (!re1) {
    return cb(null, {
      status: 401
    })
  }
  const datasetId = re1[1]
  const filename = re1[2]

  fs.readFile('./data/shapedPreviewData.json', 'utf-8', (err, data) => {
    if (err) throw err
    const arr = JSON.parse(data)

    // filename not provided, return all files
    const found = arr.find(([ dsId ]) => dsId === datasetId)
    if (!found) {
      return cb(null, { status: 404 })
    }
    const [ _, files ] = found

    if (!filename) {
      return cb(null, {
        status: 200,
        body: JSON.stringify(files),
        headers: {
          'Content-type': 'application/json'
        }
      })
    }

    const decodedFilename = decodeURIComponent(filename.slice(1))
  
    const foundFile = files.find(({ filename:fname }) => fname === decodedFilename)
    if (!foundFile) {
      return cb(null, { status: 404 })
    }
    // filename provided, return specified file
    return cb(null, {
      status: 200,
      body: JSON.stringify(foundFile),
      headers: {
        'Content-type': 'application/json'
      }
    })
  })
}
