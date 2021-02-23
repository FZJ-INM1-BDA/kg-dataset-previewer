import { TBSFingerprint, TGuideLineOpts, TOriginalFPDataType, TOriginalMetadata, TOriginalProfileDataType, TProfile, TReceptorSymbol } from "./types";
import { weave } from '../../common/weave'

export function transformBSLinear(bsLinear: TProfile, bsUnit: string): TOriginalProfileDataType {
  const returnArray = [] as TOriginalProfileDataType
  for (const key in bsLinear) {
    returnArray[key] = {
      corticalDepth: `${key}`,
      corticalDepthUnit: `%`,
      density: bsLinear[key].toString(),
      densityUnit: bsUnit
    }
  }
  returnArray['columns'] = [
    "cortical depth (value)",
    "cortical depth (unit)",
    "receptor density (value)",
    "receptor density (unit)"
  ]
  return returnArray
}

export async function waitlibLoaded() {

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
    parseReceptorProfile,
    LinearSvg,
    parseFingerprint,
    PolarSvg,
    parseReceptorMetadata
  } = weave(window['d3'], window['MathJax'])

  return {
    parseReceptorProfile,
    LinearSvg,
    parseFingerprint,
    PolarSvg,
    parseReceptorMetadata
  }
}

export function appendGuideLine(svgMain, _opts?: TGuideLineOpts) {

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

    drawingArea.on('mousemove', function(ev){
      const m = window['d3'].pointer(ev)
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

      const adjustedXPos = (xPos + 128) > 400
        ? xPos - 138
        : xPos
      const adjustedYPos = (xPos + 128) > 400
        ? yPos - 18
        : yPos
      
      window['d3'].select(`#${guideLabelContainerlId}`)
        .attr('transform', `translate(${adjustedXPos}, ${adjustedYPos})`)

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
    drawingArea.on('mousemove', function(ev) {
      const m = window['d3'].pointer(ev)
      
      const halfH = (height - margin.top - margin.bottom) / 2 + margin.top
      const halfW = (width - margin.left - margin.right) / 2 + margin.left
      const angle = Math.atan2(m[1] - halfH, m[0] - halfW)
      
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
          halfW + Math.cos(discreteAngle) * meanVal,
          halfH - Math.sin(discreteAngle) * meanVal
        ]

        const sdCircleVal = [
          halfW + Math.cos(discreteAngle) * sdVal,
          halfH - Math.sin(discreteAngle) * sdVal
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

export function transformBSRadar(bsRadar: TBSFingerprint): TOriginalFPDataType[] {
  const returnArray: TOriginalFPDataType[] = []

  for (const idx in bsRadar.labels) {
    returnArray.push({
      density: {
        mean: bsRadar.meanvals[idx].toString(),
        sd: bsRadar.stdvals[idx].toString(),
        unit: bsRadar.unit
      },
      receptor: {
        label: bsRadar.labels[idx]
      }
    })
  }
  return returnArray
}

export function transformBsMeta(bsMeta: TReceptorSymbol): TOriginalMetadata[] {
  const returnArr: TOriginalMetadata[] = []
  for (const key in bsMeta) {
    const {
      neurotransmitter,
      receptor,
    } = bsMeta[key]
    returnArr.push({
      neurotransmitter: {
        fullname: neurotransmitter.name,
        label: neurotransmitter.label,
        latex: neurotransmitter.latex,
        markdown: neurotransmitter.markdown
      },
      receptor: {
        fullname: receptor.name,
        label: key,
        latex: receptor.latex,
        markdown: receptor.markdown,
      }
    })
  }
  return returnArr
}
