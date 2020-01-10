const router = require('./router')

const app = require('express')()

app.use(require('cors')())
app.use('/datasetPreview', router)

app.listen(1234, () => console.log('app listening'))