import { Component, Prop, h, Watch, State, Method, Event, EventEmitter } from '@stencil/core';
import { KG_DATASET_PREVIEWER_BACKEND_URL, getKgInfo } from '../../utils/utils'
import { IDatasetFile, getRenderList } from '../../utils/renderUtil'


@Component({
  tag: 'kg-dataset-list'
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
    attribute: `kg-ds-prv-container-class`
  })
  containerClass: string = ``

  @Prop({
    attribute: 'kg-ds-prv-item-class'
  })
  itemClass: string = ''

  @Prop({
    attribute: 'kg-ds-prv-filter-criteria'
  })
  filterCriteriaProp: string

  private filterCriteria: string[] = []

  @Watch('filterCriteriaProp')
  filterCriteriaChanged(){
    if (!this.filterCriteriaProp) return
    try {
      const parsed = JSON.parse(this.filterCriteriaProp)
      if (!Array.isArray(parsed)) throw new Error(`kg-ds-prv-filter-criteria must be a stringified Array: ${this.filterCriteriaProp}`)
      if (!parsed.every(entry => typeof entry === 'string')) throw new Error(`every entry of kg-ds-prv-filter-criteria must be a string ${this.filterCriteriaProp}`)
      this.filterCriteria = parsed
    } catch (e) {
      throw e
    }
  }

  @Method() 
  async getDatasetFiles() {
    return this.datasetFiles
  }

  @Event({
    bubbles: true,
    composed: true
  }) kgDsPrvUpdated: EventEmitter

  @State() datasetFiles: IDatasetFile[] = []

  loadingFlag: boolean = false
  renderListFn: Function = getRenderList()
  public error: string

  @Watch('kgId')
  kgIdChangeHandler(){
    this.fetchKgIdInfo()
  }

  @Watch('itemClass')
  @Watch('containerClass')
  reGetRenderListfn(){
    this.renderListFn = getRenderList({ 
      containerClass: this.containerClass,
      itemClass: this.itemClass
     })
  }

  getSearchParam(){
    if (!this.filterCriteria || this.filterCriteria.length === 0) return null
    const search = new URLSearchParams()
    search.set('filterBy', JSON.stringify(this.filterCriteria))
    return search
  }

  fetchKgIdInfo(){

    if (this.kgId) {
      
      this.loadingFlag = true

      const searchParam = this.getSearchParam()
      getKgInfo({
        kgId: this.kgId,
        kgSchema: this.kgSchema,
        backendUrl: this.backendUrl,
        ...(
          searchParam ? { searchParam } : {}
        )
      })
        .then(arr => {
          this.datasetFiles = arr
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
    } else {
      this.error = `kgId is required`
    }
  }

  constructor() {
    this.filterCriteriaChanged()
    this.fetchKgIdInfo()
    this.reGetRenderListfn()
  }

  render() {
    const { kgId, kgSchema, backendUrl, datasetFiles, loadingFlag } = this
    this.kgDsPrvUpdated.emit({
      kgSchema,
      kgId,
      backendUrl,
      datasetFiles,
      loadingFlag
    })
    return this.error
      ? <span>{this.error}</span>
      : this.loadingFlag
        ? <div>Loading ...</div>
        : this.renderListFn(this.datasetFiles)
  }
}
