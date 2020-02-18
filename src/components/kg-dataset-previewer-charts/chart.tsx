import { h, Component, Prop, Element, Watch, State, EventEmitter, Event, Method } from '@stencil/core'
import { ChartConfiguration } from 'chart.js'
import Chart from 'chart.js'
import { patchChartJsRadar, getPatchChartJsOption, getCsvFromDataset } from '../../utils/utils'

interface PreviewData{
  "chart.js": ChartConfiguration
}

@Component({
  tag: 'kg-dataset-previewer-chart'
})
export class KgPreviewChart{

  @Event({
    bubbles: true,
    composed: true
  }) kgDsPrvUpdated: EventEmitter

  @Prop({
    attribute: 'kg-ds-prv-chartjs-data',
    reflect: false,
    mutable: false
  }) dataProp: string

  @Prop({
    reflect: true,
    attribute: 'kg-ds-prv-darkmode'
  }) darkmode: boolean = false

  data: PreviewData
  
  @Watch('dataProp')
  chartDataUpdatedHandler(){
    this.setConfigData()
  }

  @State() chartjsDataProvided: boolean = true

  @State() patchChartjsOptions = getPatchChartJsOption({ darkmode: this.darkmode })

  @Watch('darkmode')
  setPatchChartJsOption(){
    this.patchChartjsOptions = getPatchChartJsOption({ darkmode: this.darkmode })
  }

  private downloadHref: string

  @Method()
  getHrefUrl(){
    if (this.downloadHref) window.URL.revokeObjectURL(this.downloadHref)
    return new Promise((rs, rj) => {
      if (!this.canvas) return rj(`canvas does not exist`)
      this.canvas.toBlob(blob => {
        this.downloadHref = window.URL.createObjectURL(blob)
        rs(this.downloadHref)
      }, 'image/png')
    })
  }

  private csvHref: string

  @Method()
  async getCsvUrl(){
    if (this.csvHref) window.URL.revokeObjectURL(this.csvHref)
    
    const csvString = getCsvFromDataset(this.data)
    const blob = new Blob([csvString], { type: 'data:text/csv;charset=utf-8' })
    this.csvHref = window.URL.createObjectURL(blob)
    return this.csvHref
  }

  @Element()
  el: HTMLElement
  canvas: HTMLCanvasElement

  chart: Chart

  protected getHostElementInfo(){
    const rect = this.el.getBoundingClientRect()
    return {
      width: rect.width,
      height: rect.height
    }
  }

  protected componentDidUnload(){
    if (this.downloadHref) window.URL.revokeObjectURL(this.downloadHref)
    if (this.csvHref) window.URL.revokeObjectURL(this.csvHref)
  }

  protected attachChartjs():void {
    if (!this.chartjsDataProvided) {
      return
    }
    this.canvas = this.el.querySelector('canvas')
    if (!this.canvas) {
      return
    }

    const { width, height } = this.getHostElementInfo()
    this.canvas.width = width
    this.canvas.height = height
  }

  protected renderChart():void{
    this.downloadHref = null
    if (!this.data) {
      return
    }
    
    const copiedConfiguration = JSON.parse(JSON.stringify(this.data['chart.js']))

    const chartConfiguration = this.patchChartjsOptions(copiedConfiguration)

    this.chart = new Chart(this.canvas, chartConfiguration)
    this.canvas.toBlob(blob => {
      this.downloadHref = window.URL.createObjectURL(blob)
    }, 'image/png')
  }

  protected setConfigData(){
    if (!this.dataProp) return
    this.data = JSON.parse(this.dataProp)
    this.renderChart()
  }
  
  protected componentDidUpdate():void{
    this.attachChartjs()
    this.setConfigData()
  }

  protected componentDidLoad():void{
    this.attachChartjs()
    this.setConfigData()
  }

  constructor(){
    patchChartJsRadar()
  }

  render(){
    return this.chartjsDataProvided
      ? <div style={{display: 'block', position:'relative'}}>
          <canvas style={{width: '100%', height: '100%', display: 'block'}}></canvas>
        </div>
      : <span>chartOption needs to be provided</span>
  }
}
