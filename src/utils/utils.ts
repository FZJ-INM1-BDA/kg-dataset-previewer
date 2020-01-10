import Chart from 'chart.js'

export const KG_DATASET_PREVIEWER_BACKEND_URL = `http://localhost:1234/datasetPreview`
export const KG_DATASET_PREFIX = `kg-ds-prv`

export function getKgInfo({ kgId, backendUrl }) {
  return fetch(`${backendUrl}/${kgId}`).then(res => res.json())
}

export const MIME_TYPE = {
  NIFTI: 'application/nifti',
  JPEG: 'image/jpeg',
  JSON: 'application/json'
}

const KG_PREVIEW_DS_PATCH_CHARTJS = Symbol(`KG_PREVIEW_DS_PATCH_CHARTJS`)

const chartSdStyle = {
  fill : false,
  backgroundColor : 'rgba(0,0,0,0)',
  borderDash : [10, 3],
  pointRadius : 0,
  pointHitRadius : 0,
}

const chartBaseStyle = {
  fill : 'origin',
}

export function patchChartJsRadar(){
  if (window[KG_PREVIEW_DS_PATCH_CHARTJS]) return
  window[KG_PREVIEW_DS_PATCH_CHARTJS] = true

  Chart.pluginService.register({
    afterInit: function(chart){

      if (chart.config.options && chart.config.options.tooltips) {

        chart.config.options.tooltips.callbacks = {
          label(tooltipItem, data) {
            let sdValue
            if (data.datasets && typeof tooltipItem.datasetIndex != 'undefined' && data.datasets[tooltipItem.datasetIndex].label) {
              const sdLabel = data.datasets[tooltipItem.datasetIndex].label + '_sd'
              const sd = data.datasets.find(dataset => typeof dataset.label != 'undefined' && dataset.label == sdLabel)
              if (sd && sd.data && typeof tooltipItem.index != 'undefined' && typeof tooltipItem.yLabel != 'undefined') { sdValue = Number(sd.data[tooltipItem.index]) - Number(tooltipItem.yLabel) }
            }
            return `${tooltipItem.yLabel} ${sdValue ? '(' + sdValue + ')' : ''}`
          },
        }
      }
      if (chart.data.datasets) {
        chart.data.datasets = chart.data.datasets
          .map(dataset => {
            if (dataset.label && /_sd$/.test(dataset.label)) {
              const originalDS = chart.data.datasets.find(baseDS => typeof baseDS.label !== 'undefined' && (baseDS.label == dataset.label.replace(/_sd$/, '')))
              if (originalDS) {
                return Object.assign({}, dataset, {
                  data: (originalDS.data as number[]).map((datapoint, idx) => (Number(datapoint) + Number((dataset.data as number[])[idx]))),
                  ... chartSdStyle,
                })
              } else {
                return dataset
              }
            } else if (dataset.label) {
              const sdDS = chart.data.datasets.find(sdDS => typeof sdDS.label !== 'undefined' && (sdDS.label == dataset.label + '_sd'))
              if (sdDS) {
                return {
                  ...dataset,
                  ...chartBaseStyle
                }
              } else {
                return dataset
              }
            } else {
              return dataset
            }
          })
      }
    }
  })
}