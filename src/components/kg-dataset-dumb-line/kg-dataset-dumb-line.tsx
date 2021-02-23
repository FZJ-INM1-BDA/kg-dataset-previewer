import { Component, Event, EventEmitter, Prop, Watch } from "@stencil/core";
import { h } from '@stencil/core'
import { appendGuideLine, transformBSLinear, waitlibLoaded } from "../../utils/dumbLineUtil";
import { TOriginalProfileDataType, TProfile, TReceptorSymbol } from "../../utils/types";


@Component({
  tag: 'kg-dataset-dumb-line',
  styleUrl: './kg-dataset-dumb-line.style.css'
})

export class KgDatasetDumbLine {
  @Prop({
    reflect: false,
  })
  receptorSymbols: TReceptorSymbol

  @Prop({
    reflect: false
  })
  profileBs: TProfile
  
  @Prop({
    reflect: false
  })
  profile: TOriginalProfileDataType

  @Prop({
    reflect: true
  })
  profileUnit: string = 'fmol/mg'

  @Prop({
    reflect: true,
    attribute: 'kg-ds-prv-darkmode'
  })
  darkmode = false

  @Watch('profileBs')
  onProfileBSChange()  {
    const transformedData = transformBSLinear(this.profileBs, this.profileUnit)
    this.onProfileChange(transformedData)
  }

  @Watch('profile')
  async onProfileChange(_transformedData?: TOriginalProfileDataType) {
    const { LinearSvg } = await waitlibLoaded()

    const transformedData = _transformedData || this.profile
    const corticalDepthLabel = transformedData.columns[0].replace(/\s*\(.*?\)/, '')
    const corticalDepthUnit = transformedData[0].corticalDepthUnit
    const receptorDensityLabel = transformedData.columns[2].replace(/\s*\(.*?\)/, '')
    const receptorDensityUnit = transformedData[0].densityUnit
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
    this.weaveClsInst = new LinearSvg(transformedData, config)
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
    this.profileBs && this.onProfileBSChange()
    this.profile && this.onProfileChange()
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