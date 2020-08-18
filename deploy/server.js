require('dotenv').config()

const router = require('./router')
const PORT = process.env.PORT || 1234

const app = require('express')()

const HOSTNAME_PATH = process.env.HOSTNAME_PATH || '/datasetPreview'

app.use(require('cors')())
app.use(HOSTNAME_PATH, router)

app.listen(PORT, () => console.log(`app listening on port ${PORT} for path ${HOSTNAME_PATH}`))
