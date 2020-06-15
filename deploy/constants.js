const {
  APPLICATION_NAME,
} = process.env

const DS_PRV_KEY = `DS_PRV_KEY`
const DS_SINGLE_PRV_KEY = `DS_SINGLE_PRV_KEY`
const APP_NAME = APPLICATION_NAME || 'kg-dataset-previewer'

module.exports = {
  DS_SINGLE_PRV_KEY,
  DS_PRV_KEY,
  APP_NAME,
}
