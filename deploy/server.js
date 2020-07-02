require('dotenv').config()

const router = require('./router')
const PORT = process.env.PORT || 1234

const app = require('express')()

app.use(require('cors')())
app.use('/datasetPreview', router)

app.listen(PORT, () => console.log(`app listening on port ${PORT}`))
