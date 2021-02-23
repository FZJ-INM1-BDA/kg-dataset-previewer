import { Component, Event, EventEmitter, Prop, Watch } from "@stencil/core";
import { h } from '@stencil/core'
import { appendGuideLine, transformBsMeta, transformBSRadar, waitlibLoaded } from "../../utils/dumbLineUtil";
import { TBSFingerprint, TOriginalFPDataType, TOriginalMetadata, TReceptorSymbol } from "../../utils/types";


@Component({
  tag: 'kg-dataset-dumb-radar',
  styleUrl: './kg-dataset-dumb-radar.style.css'
})

export class KgDatasetDumbRadar {

  @Prop({
    reflect: false
  })
  metaBs: TReceptorSymbol

  @Prop({
    reflect: false
  })
  meta: TOriginalMetadata[]

  @Prop({
    reflect: false
  })
  radarBs: TBSFingerprint
  
  @Prop({
    reflect: false
  })
  radar: TOriginalFPDataType[]

  @Prop({
    reflect: true,
    attribute: 'kg-ds-prv-darkmode'
  })
  darkmode = false

  @Watch('metaBs')
  onMetaBsChange(){
    if (this.metaBs) {
      this.transformedMeta = transformBsMeta(this.metaBs)
    }
  }

  private transformedMeta: TOriginalMetadata[]
  private transformedData: TOriginalFPDataType[]

  @Watch('radarBs')
  onRadarBsChange()  {
    if (this.radarBs) {
      this.transformedData = transformBSRadar(this.radarBs)
      this.onRadarChange()
    }
  }

  @Watch('radar')
  async onRadarChange() {
    const { PolarSvg } = await waitlibLoaded()

    const transformedData = this.transformedData || this.radar
    const config = {
      cssSetColor: true
    }
    this.weaveClsInst = new PolarSvg(transformedData, config)
    this.weaveClsInst.setMetadata(
      this.transformedMeta || this.meta
    )
    this.renderD3()
  }


  @Event({
    bubbles: true,
    composed: true,
    eventName: 'kg-ds-prv-regional-feature-mouseover'
  }) featureMouseOver: EventEmitter

  private weaveClsInst: any

  private _containerEl: HTMLElement
  get containerEl() {
    return this._containerEl
  }
  set containerEl(el: HTMLElement) {
    this._containerEl = el
    this.renderD3()
  }

  protected uuid: string
  constructor(){
    const arr = crypto.getRandomValues(new Uint32Array(1))
    this.uuid = arr[0].toString(16)

    // check metafirst
    this.metaBs && this.onMetaBsChange()

    this.radarBs && this.onRadarBsChange()
    this.radar && this.onRadarChange()
  }

  renderD3() {
    
    if (!this.containerEl) return
    if (!this.weaveClsInst) return

    while(this.containerEl.childElementCount > 0) this.containerEl.removeChild(this.containerEl.children[0])
    const svgMain = this.weaveClsInst.generateD3(this.containerEl)
    appendGuideLine.call(this, svgMain)
  }

  render(){
    return <div class="container" ref={el => this.containerEl = el}></div>
  }
}