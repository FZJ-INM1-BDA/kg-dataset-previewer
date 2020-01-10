const fs = require('fs')

const data = fs.readFileSync('./shapedPreviewData.json', 'utf-8')
const arr = JSON.parse(data)

const mutateLine = (item, key, arr) => {
  const { mimetype, data } = item
  if (mimetype !== 'application/json') return
  if (!data) return

  const { chartType, chartOptions, labels, datasets, colors } = data
  if (chartType !== 'line') return
  const { backgroundColor } = colors[0] 

  const { title } = chartOptions
  const { text } = title
  item.data = {
    "chart.js": {
      type: 'line',
      options: {
        responsive: true,
        scales: {
          xAxes: [{
            type: 'linear',
            ticks: {
              stepSize: 20
            },
            scaleLabel: {
              display: true,
              labelString: 'cortical depth %'
            },
          }],
          yAxes: [{
            scaleLabel: {
              display: true,
              labelString: 'receptor density (fmol/mg protein)',
            },
          }],
        },
        legend: {
          display: false
        },
        title: {
          display: true,
          text
        }
      },
      data: {
        labels: datasets[0].data.map(({ x }) => x),
        datasets: datasets.map(({ data }) => {
          return {
            backgroundColor,
            label: text,
            data
          }
        })
      }
    }
  }
}

const mutateRadar = (item) => {

  const { mimetype, data } = item
  if (mimetype !== 'application/json') return
  if (!data) return

  const { chartType, chartOptions, labels, datasets, colors } = data
  if (chartType !== 'radar') return

  const { backgroundColor } = colors[0] 

  const { title } = chartOptions
  const { text } = title
  item.data = {
    "chart.js": {
      type: 'radar',
      options: {
        responsive: true,
        legend: {
          display: true
        },
        title: {
          display: true,
          text
        },
        scale: {
          ticks: {
            showLabelBackdrop: false
          }
        },
      },
      data: {
        labels,
        datasets: datasets.map(ds => {
          return {
            ...ds,
            ...( ds.label === 'mean'
              ? { backgroundColor }
              : {} )
          }
        })
      }
    }
  }
}

arr.forEach(([ key, items ]) => {
  items.forEach(mutateLine)
  items.forEach(mutateRadar)
})

fs.writeFileSync('./shapedPreviewData.json', JSON.stringify(arr, null, 2), 'utf-8')