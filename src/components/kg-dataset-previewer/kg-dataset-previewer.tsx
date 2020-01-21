import { Component, Prop, h, Watch, State, Method, Element, Event, EventEmitter } from '@stencil/core';
import { KG_DATASET_PREVIEWER_BACKEND_URL } from '../../utils/utils'
import { IDatasetFile, getRenderFunction, prependUrl } from '../../utils/renderUtil'


@Component({
  tag: 'kg-dataset-previewer'
})
export class KgDatasetPreviewer {

  @Prop({
    reflect: true,
    attribute: `kg-ds-prv-kg-schema`
  }) kgSchema: string = `minds/core/dataset/v1.0.0`;

  @Prop({
    reflect: true,
    attribute: `kg-ds-prv-kg-id`
  }) kgId: string;

  @Prop({
    reflect: true,
    attribute: `kg-ds-prv-backend-url`
  }) backendUrl: string = KG_DATASET_PREVIEWER_BACKEND_URL;

  @Prop({
    reflect: true,
    attribute: 'kg-ds-prv-filename'
  }) filename: string

  @Prop({
    reflect: true,
    attribute: `kg-ds-prv-darkmode`
  }) darkmode: boolean = false

  loadingFlag: boolean = false
  error: string
  @State() displayFile: IDatasetFile
  @State() renderFn: Function = getRenderFunction({ darkmode: this.darkmode })


  @Element()
  el: HTMLElement

  @Event({
    bubbles: true,
    composed: true
  }) renderEvent: EventEmitter


  @Method()
  async getDownloadPreviewHref(){
    
    const imgTag = this.el.querySelector('img')
    if (imgTag) return imgTag.getAttribute('src')

    const chartEl = this.el.querySelector('kg-dataset-previewer-chart')
    if (chartEl) return await chartEl['getHrefUrl']()

    throw new Error(`neither img nor chart exist`)
  }

  @Method()
  async getDownloadCsvHref(){
    const chartEl = this.el.querySelector('kg-dataset-previewer-chart')
    if (chartEl) return await chartEl['getCsvUrl']()

    throw new Error(`chart does not exist`)
  }

  @Watch('darkmode')
  setNewRenderRn(){
    this.renderFn = getRenderFunction({ darkmode: this.darkmode })
  }

  @Watch('kgId')
  @Watch('filename')
  fetchKgIdInfo() {
    this.error = null
    if (!this.kgId) {
      this.error = `kgId must be defined`
      return
    }
    if (!this.filename) {
      this.error = `filename must be defined`
      return
    }

    this.loadingFlag = true
    fetch(`${this.backendUrl}/${encodeURIComponent(this.kgId)}/${encodeURIComponent(this.filename)}`)
      .then(res => res.json())
      .then(json => {
        const { url } = json
        this.displayFile = {
          ...json,
          ...(url
            ? { url: prependUrl({ url, backendUrl: this.backendUrl }) }
            : {})
        }
      })
      .then(() => {
        this.loadingFlag = false
      })
      .catch(err => {
        this.error = err.toString()
      })
      .then(() => {
        this.loadingFlag = false
      })

  }

  constructor() {
    this.fetchKgIdInfo()
  }

  render() {
    setTimeout(this.renderEvent.emit)
    return this.error
      ? <span>{this.error}</span>
      : this.loadingFlag
        ? <span>Loading ...</span>
        : this.renderFn(this.displayFile)
  }
}
