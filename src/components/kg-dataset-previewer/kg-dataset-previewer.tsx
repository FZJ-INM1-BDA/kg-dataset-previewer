import { Component, Prop, h, Watch, State } from '@stencil/core';
import { KG_DATASET_PREVIEWER_BACKEND_URL } from '../../utils/utils'
import { IDatasetFile, getRenderFunction, prependUrl } from '../../utils/renderUtil'


@Component({
  tag: 'kg-dataset-previewer'
})
export class KgDatasetPreviewer {

  @Prop({
    attribute: `kg-ds-prv-kg-schema`
  }) kgSchema: string = `minds/core/dataset/v1.0.0`;

  @Prop({
    attribute: `kg-ds-prv-kg-id`
  }) kgId: string;

  @Prop({
    attribute: `kg-ds-prv-backend-url`
  }) backendUrl: string = KG_DATASET_PREVIEWER_BACKEND_URL;

  @Prop({
    attribute: 'kg-ds-prv-filename'
  }) filename: string

  loadingFlag: boolean = false
  error: string
  @State() displayFile: IDatasetFile
  @State() renderFn: Function = getRenderFunction()

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
    return this.error
      ? <span>{this.error}</span>
      : this.loadingFlag
        ? <span>Loading ...</span>
        : this.renderFn(this.displayFile)
  }
}
