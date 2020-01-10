import { h, Component, Prop, Element, Watch, State } from '@stencil/core'
import { ChartConfiguration } from 'chart.js'
import Chart from 'chart.js'
import { patchChartJsRadar } from '../../utils/utils'

interface PreviewData{
  "chart.js": ChartConfiguration
}

@Component({
  tag: 'kg-dataset-previewer-chart'
})
export class KgPreviewChart{

  @Prop({
    attribute: 'kg-ds-prv-chartjs-data',
    reflect: false,
    mutable: false
  }) dataProp: string

  data: PreviewData
  
  @Watch('dataProp')
  chartDataUpdatedHandler(){
    this.setConfigData()
  }

  @State() chartjsDataProvided: boolean = true

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
    if (!this.data) {
      return
    }
    
    this.chart = new Chart(this.canvas, this.data['chart.js'])
  }

  protected setConfigData(){
    this.data = JSON.parse(this.dataProp)
    this.renderChart()
  }
  
  protected componentDidUpdate():void{
    this.attachChartjs()
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
