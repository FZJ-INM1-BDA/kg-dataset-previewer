const fs = require('fs')

const corsHeader = {
  'Access-Control-Allow-Origin': '*',
  // 'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET'
}

exports.handler = (ev, ctx, cb) => {
  const {
    path,
    httpMethod,
    headers,
    queryStringParameters,
    body,
    isBase64Encoded,
  } = ev

  if (httpMethod === 'OPTIONS') {
    return cb(null, {
      status: 200,
      headers: corsHeader
    })
  }

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
      statusCode: 401
    })
  }
  const fullReq = re0[1]

  const queryingData = /^data\/([a-zA-Z0-9/_]+\.jpg)$/.exec(fullReq)
  if (queryingData) {
    const dataPath = queryingData[1]
    fs.readFile(`./data/${dataPath}`, 'base64', (err, data) => {
      if (err) {
        return cb(err)
      }
      cb(null, {
        statusCode: 200,
        body: data,
        headers: {
          'Content-type': 'image/jpg'
        },
        isBase64Encoded: true
      })
    })
  }

  const re1 = /^([0-9a-f-]+)(\/.+)?$/.exec(fullReq)
  if (!re1) {
    return cb(null, {
      statusCode: 401
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
          'Content-type': 'application/json',
          ...corsHeader
        }
      })
    }

    const decodedFilename = decodeURIComponent(filename.slice(1))
  
    const foundFile = files.find(({ filename:fname }) => fname === decodedFilename)
    if (!foundFile) {
      return cb(null, { statusCode: 404 })
    }
    // filename provided, return specified file
    return cb(null, {
      status: 200,
      body: JSON.stringify(foundFile),
      headers: {
        'Content-type': 'application/json',
        ...corsHeader
      }
    })
  })
}
