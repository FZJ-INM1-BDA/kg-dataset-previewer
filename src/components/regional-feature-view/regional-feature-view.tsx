import { Component, Prop, h, Watch, State, Event, EventEmitter } from "@stencil/core";
import { KG_DATASET_PREVIEWER_BACKEND_URL } from "../../utils/utils";
import { prependUrl } from "../../utils/renderUtil";
import { appendGuideLine, waitlibLoaded } from "../../utils/dumbLineUtil";

let parseReceptorProfile, LinearSvg, parseFingerprint, PolarSvg, parseReceptorMetadata

interface IPreviewFile{
  name: string
  filename: string
  mimetype: string
  ['@context']: {
    [key: string]: string
  },
  url: {
    [key: string]: string
  }
  data?: {
    [key: string]: string
  }
}

@Component({
  tag: 'kg-ds-prv-regional-feature-view',
  styleUrl: 'regional-feature-view.style.css'
})

export class RegionalFeatureView{

  uuid: string = 'undefined-uuid'

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

  @Prop({
    reflect: false,
    attribute: 'kg-ds-prv-data'
  }) injectedData: any

  @State() error: string
  @State() loading: boolean

  @Event({
    bubbles: true,
    composed: true,
    eventName: 'kg-ds-prv-regional-feature-mouseover'
  }) featureMouseOver: EventEmitter

  @Watch('kgSchema')
  @Watch('kgId')
  @Watch('filename')
  async fetchKgInfo(){
    this.error = null

    if (!this.kgId) {
      this.error = `kgId must be defined`
      return
    }
    if (!this.filename) {
      this.error = `filename must be defined`
      return
    }

    this.loading = true
    const fetchingMoreInfoUrl = new URL(`${this.backendUrl}/raw_proxy_data/${encodeURIComponent(this.kgSchema)}/${encodeURIComponent(this.kgId)}/${encodeURIComponent(this.filename)}`)
    fetchingMoreInfoUrl.searchParams.set('returnOk', '1')
    const resp = await fetch(fetchingMoreInfoUrl.toString())
    if (!resp.ok) {
      this.error = `Fetching error`
      return
    }
    let responseJson: IPreviewFile
    try {
      const responseBody = await resp.text()
      responseJson = JSON.parse(responseBody)
    } catch (e) {
      this.error = `Parsing response error: response cannot be parsed as JSON`
      return
    }
    
    await this.processPreviewMetadata(responseJson)
  }

  async waitLibLoaded(){

    const {
      parseReceptorProfile: prp,
      LinearSvg: LSvg,
      parseFingerprint: pRfp,
      PolarSvg: PSvg,
      parseReceptorMetadata: pRMeta
    } = await waitlibLoaded()

    parseReceptorProfile = prp
    LinearSvg = LSvg
    PolarSvg = PSvg
    parseFingerprint = pRfp
    parseReceptorMetadata = pRMeta
  }

  renderD3(){
    if (!this.containerEl) return
    if (!this.weaveClsInst) return
    while(this.containerEl.childElementCount > 0) this.containerEl.removeChild(this.containerEl.children[0])
    const svgMain = this.weaveClsInst.generateD3(this.containerEl)

    appendGuideLine.call(this, svgMain)
  }

  private _containerEl: HTMLElement
  get containerEl(){
    return this._containerEl
  }

  set containerEl(el: HTMLElement){
    this._containerEl = el
    this.renderD3()
  }
  private weaveClsInst: any

  async processPreviewMetadata(input: IPreviewFile){
    await this.waitLibLoaded()
    const { data, mimetype } = input
    // TODO check type, profile vs autoradiograph vs fingerprint

    if (mimetype.indexOf('type=profile') >= 0) {
      const parsedPr = parseReceptorProfile(data['url'])

      const corticalDepthLabel = parsedPr.columns[0].replace(/\s*\(.*?\)/, '')
      const corticalDepthUnit = parsedPr[0].corticalDepthUnit
      const receptorDensityLabel = parsedPr.columns[2].replace(/\s*\(.*?\)/, '')
      const receptorDensityUnit = parsedPr[0].densityUnit
      const config = {
        xAxis: {
          label: {
            text: `${corticalDepthLabel} (${corticalDepthUnit})`
          }
        },
        yAxis: {
          label: {
            text: `${receptorDensityLabel} (${receptorDensityUnit})`
          }
        },
        cssSetColor: true
      }
      this.weaveClsInst = new LinearSvg(parsedPr, config)
    } else if (mimetype.indexOf('type=fingerprint') >= 0) {
      const parsedMetadata = parseReceptorMetadata(data['receptors.tsv'])
      const parsedFp = parseFingerprint(data['url'])
      const config = {
        cssSetColor: true
      }
      this.weaveClsInst = new PolarSvg(parsedFp, config)
      this.weaveClsInst.setMetadata(parsedMetadata)
      
    } else if (mimetype.indexOf('image') >= 0) {
      const imageUrl = input['data']['image']['url']
      const prependedImageUrl = prependUrl({ backendUrl: this.backendUrl, url: imageUrl })
      this.containerEl.style.background = `url('${prependedImageUrl}') center center / contain no-repeat`
      this.containerEl.setAttribute(`data-img-src`, prependedImageUrl)
    } else {
      throw new Error(`mimetype ${mimetype} cannot be parsed properly`)
    }

    this.renderD3()
  }

  constructor(){
    const arr = crypto.getRandomValues(new Uint32Array(1))
    this.uuid = arr[0].toString(16)

    this.fetchKgInfo()
  }

  render(){
    return <div class="container" ref={el => this.containerEl = el}></div>
  }
}
