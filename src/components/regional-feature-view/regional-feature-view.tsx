import { Component, Prop, h, Watch, State, Event, EventEmitter } from "@stencil/core";
import { KG_DATASET_PREVIEWER_BACKEND_URL } from "../../utils/utils";
import { weave } from '../../../common/weave'
import { prependUrl } from "../../utils/renderUtil";

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
    const libReady = () => window['d3'] && window['MathJax']

    const pr = new Promise(rs => {
      let intervalRef
      if (libReady()) {
        rs()
      } else {
        intervalRef = setInterval(() => {
          if (libReady) {
            clearInterval(intervalRef)
            rs()
          }
        }, 200)
      }
    })
    await pr
    const {
      parseReceptorProfile: prp,
      LinearSvg: LSvg,
      parseFingerprint: pRfp,
      PolarSvg: PSvg,
      parseReceptorMetadata: pRMeta
    } = weave(window['d3'], window['MathJax'])
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

    const guideLineXId = `guideLineX_${this.uuid}`
    const guideLineYId = `guideLineY_${this.uuid}`
    const guideCircle0Id = `guideCircle0Id_${this.uuid}`
    const guideCircle1Id = `guideCircle1Id_${this.uuid}`
    const guideLabelContainerlId = `guideLabelContainerlId_${this.uuid}`
    const guideLabelTextId = `guideLabelTextId_${this.uuid}`
    const guideLabelBoxId = `guideLabelBoxId_${this.uuid}`

    svgMain.append('line')
      .attr('id', guideLineXId)
      .attr('class', 'guideLine')
      .attr('fill', 'none')
      .attr('stroke-width', '1px')
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 0)
      .attr("y2", 0)

    svgMain.append('line')
      .attr('id', guideLineYId)
      .attr('class', 'guideLine')
      .attr('fill', 'none')
      .attr('stroke-width', '1px')
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 0)
      .attr("y2", 0)
    
    svgMain.append('circle')
      .attr('id', guideCircle0Id)
      .attr('stroke-width', 1)
      .attr('stroke', 'currentColor')
      .attr('fill', 'none')
      .attr('r', 0)
      .attr('cx', 0)
      .attr('cy', 0)

    svgMain.append('circle')
      .attr('id', guideCircle1Id)
      .attr('stroke-width', 1)
      .attr('stroke', 'currentColor')
      .attr('fill', 'none')
      .attr('r', 0)
      .attr('cx', 0)
      .attr('cy', 0)

    const guideLabeContainer = svgMain.append(`g`).attr('id', guideLabelContainerlId)
    
    guideLabeContainer.append('text')
      .attr('transform', 'translate(10, 0)')
      .attr('id', guideLabelTextId)
      .attr('font-family', 'inherit')
      .attr('fill', 'currentColor')
      .attr('dominant-baseline', 'middle')
      .text('')

    const rectHeight = 30
    guideLabeContainer.insert('rect', 'text')
      .attr('id', guideLabelBoxId)
      .attr('class', 'transparent')
      .attr('rx', 6)
      .attr('ry', 6)
      .attr('height', rectHeight)
      .attr('width', 128)
      .attr('transform', `translate(4, -${rectHeight/2})`)

    /**
     * function declaration is required
     * as arrow function leaks stencil cmp "this" to on mouse move invocation
     */
    const onMouseLeaveHook: Function[] = []
    const { featureMouseOver } = this
    function clearGuidingLines(){
      window['d3'].select(`#${guideLineXId}`)
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 0)
        .attr("y2", 0)
        
      window['d3'].select(`#${guideLineYId}`)
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 0)
        .attr("y2", 0)

      window['d3'].select(`#${guideCircle0Id}`)
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', 0)

      window['d3'].select(`#${guideCircle1Id}`)
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', 0)

      window['d3'].select(`#${guideLabelTextId}`).text('')
      window['d3'].select(`#${guideLabelBoxId}`)
        .attr('class', 'transparent')

      for (const hook of onMouseLeaveHook) {
        hook()
      }

      featureMouseOver.emit({
        type: null,
        data: null
      })
    }
    const drawingArea = svgMain
    const { margin, width, height,
      scaleX, scaleY, linearData,
      linearScale, polarData
    } = this.weaveClsInst

    if (linearData) {

      drawingArea.on('mousemove', function(){
        const m = window['d3'].mouse(this)
        const xDisplacement = m[0] - margin.left
        const xValue = scaleX.invert(xDisplacement)
        const xBisectedVal = window['d3'].bisect(linearData.map(v => v[0]), xValue)
  
        const val = linearData[xBisectedVal]
        if (!val) return clearGuidingLines()
        const yValue = scaleY(val[1])
  
        const xPos = scaleX(xBisectedVal) + margin.left
        const yPos = yValue + margin.top
        
        window['d3'].select(`#${guideLineXId}`)
          .attr("x1", xPos)
          .attr("y1", scaleY(0) + margin.top)
          .attr("x2", xPos)
          .attr("y2", yPos)
          
        window['d3'].select(`#${guideLineYId}`)
          .attr("x1", scaleX(0) + margin.left)
          .attr("y1", yPos)
          .attr("x2", xPos)
          .attr("y2", yPos)
  
        window['d3'].select(`#${guideCircle0Id}`)
          .attr('cx', xPos)
          .attr('cy', yPos)
          .attr('r', 5)
  
        window['d3'].select(`#${guideLabelContainerlId}`)
          .attr('transform', `translate(${xPos}, ${yPos})`)
  
        window['d3'].select(`#${guideLabelTextId}`)
          .text(`( ${xBisectedVal}, ${val[1]} )`)
  
        window['d3'].select(`#${guideLabelBoxId}`)
          .attr('class', 'semi-transparent')

        featureMouseOver.emit({
          type: 'line-graph',
          data: {
            position: [
              xBisectedVal, val[1]
            ]
          }
        })
      })

    }
    if (polarData) {
      drawingArea.on('mousemove', function() {
        const m = window['d3'].mouse(this)
        
        const angle = Math.atan2(m[1] - height/2, m[0] - width/2)
        const idx = Math.round(
          /**
           * correct for atan2 starts to positive x axis
           * correct for modulus in js does not correct for -ve value
           */
          (angle + (5 * Math.PI / 2)) / (2 * Math.PI) * polarData.length
        ) % polarData.length

        drawingArea.selectAll(`.radialGuideLine`)
          .attr('class', function(_, _idx){
            return _idx === idx
              ? `radialGuideLine radialGuideLine-${_idx}`
              : `radialGuideLine radialGuideLine-${_idx} semi-opaque`
          })

        if (!!polarData[idx]) {
          const { density } = polarData[idx]
          const { mean, sd } = density

          /**
           * cannot use angle directly, as it is non discrete
           */
          const discreteAngle = Math.PI - (2 * Math.PI / polarData.length) * idx - Math.PI / 2
          const meanVal = linearScale(mean)
          const sdVal = linearScale(mean + sd)

          const meanCircleVal = [
            width / 2 + Math.cos(discreteAngle) * meanVal,
            height / 2 - Math.sin(discreteAngle) * meanVal
          ]

          const sdCircleVal = [
            width / 2 + Math.cos(discreteAngle) * sdVal,
            height / 2 - Math.sin(discreteAngle) * sdVal
          ]

          window['d3'].select(`#${guideCircle0Id}`)
            .attr('cx', meanCircleVal[0])
            .attr('cy', meanCircleVal[1])
            .attr('r', 5)

          window['d3'].select(`#${guideCircle1Id}`)
            .attr('cx', sdCircleVal[0])
            .attr('cy', sdCircleVal[1])
            .attr('r', 5)

          window['d3'].select(`#${guideLabelContainerlId}`)
            .attr('transform', `translate(${meanCircleVal[0]}, ${meanCircleVal[1]})`)
    
          window['d3'].select(`#${guideLabelTextId}`)
            .text(`( ${mean} ± ${sd} )`)
    
          window['d3'].select(`#${guideLabelBoxId}`)
            .attr('class', 'semi-transparent')
          
          featureMouseOver.emit({
            type: 'line-graph',
            data: polarData[idx]
          })
        }
      })

      onMouseLeaveHook.push(() => {
        drawingArea.attr('class', '')
        drawingArea.selectAll('.semi-opaque')
          .attr('class', (_, idx) => `radialGuideLine radialGuideLine-${idx}`)
      })
    }

    drawingArea.on('mouseleave', clearGuidingLines)
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
