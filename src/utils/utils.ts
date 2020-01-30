import Chart, { ChartConfiguration, ChartOptions, ChartData } from 'chart.js'

// managed by replace plugin
export const KG_DATASET_PREVIEWER_BACKEND_URL = `__BACKEND_URL__`
export const KG_DATASET_PREFIX = `kg-ds-prv`

export function getKgInfo({ kgId, backendUrl, searchParam = new URLSearchParams() }) {
  return fetch(`${backendUrl}/${kgId}?${searchParam.toString()}`).then(res => res.json())
}

export const MIME_TYPE = {
  NIFTI: 'application/nifti',
  JPEG: 'image/jpeg',
  JSON: 'application/json'
}

const KG_PREVIEW_DS_PATCH_CHARTJS = Symbol(`KG_PREVIEW_DS_PATCH_CHARTJS`)

const chartCommon = {
  pointRadius : 0
}

const chartSdStyle = {
  fill : false,
  backgroundColor : 'rgba(0,0,0,0)',
  borderColor: `rgba(128, 128, 128, 0.2)`,
  borderDash : [10, 3],
  pointRadius : 0,
  pointHitRadius : 0,
  ...chartCommon
}

const chartBaseStyle = {
  fill : 'origin',
  pointHitRadius: 10,
  borderColor: `rgba(128, 128, 128, 0.2)`,
  ...chartCommon
}

const chartDefaultOption: Partial<ChartOptions>&any = {
  animation: false
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

            // if datasets is a standard deviation in radar graph
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
                // if dataset is a radar graph, but not the standard deviation portion
                return {
                  ...dataset,
                  ...chartBaseStyle
                }
              } else {
                // other dataset (linear profile)
                return {
                  ...dataset,
                  ...chartBaseStyle
                }
              }
            } else {
              return dataset
            }
          })
      }
    }
  })
}

export function getPatchChartJsOption({ darkmode } : { darkmode: boolean } = { darkmode: false}){

  const patchColor = prop => {
    if (!prop) return null
    const { ...rest } = prop
    return {
      ...rest,
      color: darkmode
        ? `rgba(128, 128, 128, 0.2)`
        : `rgba(128, 128, 128, 0.2)`
    }
  }

  const patchFontColor = prop => {
    if (!prop) return null
    const { fontColor, ...rest } = prop
    return {
      ...rest,
      fontColor: darkmode
        ? `rgba(255, 255, 255, 0.8)`
        : `rgba(0, 0, 0, 0.8)`
    }
  }

  const patchScale = scale => {
    if (!scale) return null
    const {
      angleLines,
      gridLines,
      ticks,
      scaleLabel,
      pointLabels,
      ...restScale
    } = scale
    const overwritingObj = {
      ...(
        {angleLines: patchColor(angleLines || {})}
      ),
      ...(
        {gridLines: patchColor(gridLines || {})}
      ),
      ...{scaleLabel: patchFontColor(scaleLabel || {})},
      ...{ticks: patchFontColor(ticks || {})},
      ...{pointLabels: patchFontColor(pointLabels || {})}
    }
    return {
      ...restScale,
      ...overwritingObj
    }
  }

  const patchScales = scales => {
    if (!scales) return null
    const { xAxes, yAxes, ...rest } = scales
    return {
      ...rest,
      ...(
        xAxes
        ? { xAxes: xAxes.map(patchScale) }
        : {}
      ),
      ...(
        yAxes
        ? { yAxes: yAxes.map(patchScale) }
        : {}
      )
    }
  }
  return function patchChartJsOption(chartOption: ChartConfiguration): ChartConfiguration{
    const { options , ...rest } = chartOption
    const { scale, legend, title, scales, animation = {}, ...otherOptions } = options
    
    return {
      ...rest,
      options: {
        ...chartDefaultOption,
        ...otherOptions,
        ...(
          scale
          ? {scale: patchScale(scale)}
          : {}
        ),
        ...(
          title
          ? {title: patchFontColor(title)}
          : {}
        ),
        ...(
          scales
          ? {scales: patchScales(scales)}
          : {}
        ),
        ...(
          legend
          ? {
              legend: {
                ...legend,
                labels:patchFontColor(legend.labels || {})
              }
            }
          : {}
        )
      }
    }
  }
}

export function wrapTextForCsv(text){
  return `"${text.toString().replace(/"/g, '""')}"`
}

export function getCsvFromDataset(data){
  const chartJs = data['chart.js']
  if (!chartJs) throw new Error(`data['chart.js'] is not defined.`)
  const { type } = chartJs as ChartConfiguration
  let output = ''
  if (type === 'radar') {
    const { data } = chartJs
    const { labels, datasets } = data as ChartData
    
    output += `"",${datasets.map(({ label }) => wrapTextForCsv(label)).join(',')}`
    for (const indexAsStr in labels){
      output += `\n${wrapTextForCsv(labels[indexAsStr])},${datasets.map(({ data }) => wrapTextForCsv(data[indexAsStr])).join(',')}`
    }
    return output
  }
  if (type === 'line') {
    const { options, data } = chartJs
    const { scales } = options
    const { xAxes, yAxes } = scales
    const { scaleLabel: xScaleLabel} = xAxes[0]
    const { labelString: xLabelString } = xScaleLabel

    const { scaleLabel: yScaleLabel} = yAxes[0]
    const { labelString: yLabelString } = yScaleLabel

    output += `${wrapTextForCsv(xLabelString)},${wrapTextForCsv(yLabelString)}`

    const { labels, datasets } = data
    for (const index in labels){
      output += `\n${wrapTextForCsv(labels[index])},${wrapTextForCsv(datasets.map(({ data }) => wrapTextForCsv(data[index].y) ))}`
    }

    return output
  }
  throw new Error(`Unknown chartjs type: ${type}`)
}
