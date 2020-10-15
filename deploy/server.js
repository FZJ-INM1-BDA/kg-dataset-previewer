require('dotenv').config()

const router = require('./router')
const PORT = process.env.PORT || 1234

const app = require('express')()

const HOSTNAME_PATH = process.env.HOSTNAME_PATH || '/datasetPreview'

app.use(require('cors')())
app.use(HOSTNAME_PATH, router)

app.use((err, req, res, next) => {
  if (err) {
    const message = err && err['message'] || 'catching error'
    const { originalUrl } = req
    console.error(`catching error, ${message}`, { originalUrl })
    res.status(400).send(`Bad Request`)
  }
  res.status(404).send(`Not found.`)
})

app.listen(PORT, () => console.log(`app listening on port ${PORT} for path ${HOSTNAME_PATH}`))
