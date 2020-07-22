// const d3 = require('d3')
// d3v ^ 5.16.0

(function(exports){
  // let d3, mathjax

  // conversion from ex to pixel
  // TODO remove fudge factor in future
  const fudgeFactor = 6.5

  const Image = (typeof window !== 'undefined' && window.Image) || (() => {
    try {
      return require('canvas').Image
    } catch (e) {
      return null
    }
  })()

  const btoa = (typeof window !== 'undefined' && window.btoa) || (input => Buffer.from(input).toString('base64'))
  class BaseSvg{

    convertSvgToPng(svgString){
      if (!Image) return Promise.reject(`Image not defined. If in node, did you include canvas as dependency?`)
      return new Promise((rs, rj) => {
        const canvas = this.document.createElement('canvas')
        canvas.width = this.width
        canvas.height = this.height
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = `white`
        ctx.fillRect(0, 0, this.width, this.height)
  
        const img = new Image()
        img.onload = () => {
          ctx.drawImage(img, 0, 0)
          const dataurl = canvas.toDataURL()
          rs(dataurl)
        }
        img.onerror = rj
        
        img.src = `data:image/svg+xml;base64,${btoa(svgString)}`
      })
    }

    static CalculateWidthHeight(svgString, document) {
      if (!svgString) throw new Error(`svg needs to be defined`)

      const container = document.createElement('div')
      const el = document.createElement('svg')
      container.appendChild(el)
      document.body.appendChild(container)
      el.outerHTML = svgString
      const { width, height} = container.children[0].getBoundingClientRect()
      document.body.removeChild(container)
      return { width, height }
    }

    static GenerateLabel(label) {
      const { latex } = label

      const trueLatex = latex.replace(/^\$*/, '').replace(/\$*$/, '') //.replace(/^\\+/, '\\')
      const _ = mathjax.tex2svg(trueLatex, { display: true })
      const { width, height } = _.children[0].attributes
      return {
        label: mathjax.startup.adaptor.innerHTML(_),
        width,
        height
      }
    }

    constructor(config = {}){
      const { width, height, margin, fontFamily } = config
      this.width = width || 600
      this.height = height || 600
      this.margin = {
        left: 70,
        right: 70,
        top: 70,
        bottom: 70,
        ...margin
      }

      this.fontFamily = fontFamily || `Arial, Helvetica, san-serif`

      const w = (typeof window !== 'undefined' && window) || (() => {
        const { JSDOM } = require('jsdom')
        return new JSDOM(``, { runScripts: 'outside-only' }).window
      })()

      const { document } = w
      this.document = document
      this.window = w

      this.redraw()
    }

    redraw(){
      this.clientWidth = this.width - this.margin.left - this.margin.right
      this.clientHeight = this.height - this.margin.top - this.margin.bottom
    }

    appendLabel(svg, label, anchor = {}){
      const { latex, text } = label
      const { top, bottom, left, right } = anchor

      // master container of the label
      // apply label at the very end
      // because element.getBoundingClientRect() method calculates the post transformed
      const labelGroup = svg.append('g')
        .attr('font-family', this.fontFamily)

      if (latex && mathjax) {

        // MathJax renders the svg inside mjx-container element, which does not seem to redner
        // luckily, we can just get the first child, which is the svg element
        const _ = mathjax.tex2svg(latex)
        const labelSvg = _.children[0]

        // latex container. Transform this to center the svg
        // need to append to dom, then getBoundingRect will return non zero values
        // NB: do not call too often. tanks performance
        const latexContainer = labelGroup.append('g')
        latexContainer.node().append(labelSvg)
        const { width, height } = labelSvg.getBoundingClientRect()
        console.log({ width, height })

        // transform to center the svg
        const xTranslate = left
          ? 0
          : right
            ? width * -1
            : width / -2

        const yTranslate = top
          ? 0
          : bottom
            ? height * -1
            : height / -2
        latexContainer.attr('transform', `translate(${xTranslate}, ${yTranslate})`)
      } else if (text) {
        labelGroup.append('text')
          .style('text-anchor', left ? 'start' : right ? 'end' : 'middle')
          .attr('dominant-baseline', top ? 'hanging' : bottom ? 'baseline' : 'middle')
          .text(text)
      }

      return labelGroup
    }

    generateSvg(){
      throw new Error(`Needs to be overwritten by subclasses`)
    }
  }

  class PolarSvg extends BaseSvg{
    constructor(data, config){
      super(config)

      this.polarData = data.map(({ density, ...rest }) => {
        return {
          ...rest,
          density: {
            ...density,
            mean: Number(density.mean),
            sd: Number(density.sd)
          }
        }
      })

      this.diameter = Math.min(this.clientWidth, this.clientHeight)

      this.meanAttrs = {
        fill: () => `rgba(200, 200, 200, 1.0)`,
      }

      this.sdAttrs = {
        fill: () => `none`,
        'stroke-width': () => '1px' ,
        stroke: () => 'rgba(100, 100, 100, 1.0)' 
      }

      const {  } = config || {}
    }

    setMetadata(metadata) {
      this.metadata = metadata
    }

    generateSvg(){
      const svgMain = d3.select(this.document.body)
        .append('svg')
          .attr('xmlns', 'http://www.w3.org/2000/svg')
          .style('background-color', 'white')
          .attr('width', this.width)
          .attr('height', this.height)
      const svg = svgMain
        .append('g')
          .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)
      
      // define linear scale
      const linearScale = d3
        .scaleLinear()
        .range([ 0, this.diameter / 2 ])
        .domain([ 0 , d3.max(this.polarData.map(({ density }) => density.mean + density.sd)) ])

      // define mean polar
      const meanRadial = d3.lineRadial()
        .angle((d, i) => Math.PI * 2 / (this.polarData.length) * i)
        .radius(({ density }) => linearScale(density.mean))
      
      // define sd polar
      const sdRadial = d3.lineRadial()
        .angle((d, index) => Math.PI * 2 / (this.polarData.length) * index)
        .radius(({ density }) => linearScale(density.mean + density.sd))
        .curve(d3.curveLinearClosed)

      // center of polar graph
      const graphContainer = svg.append('g')
        .attr('transform', `translate(${this.diameter / 2}, ${this.diameter / 2})`)

      // render mean
      const mean = graphContainer.append('path')
        .data( [ this.polarData ] )
        .attr('d', meanRadial)

      for (const key in this.meanAttrs) {
        mean.attr(key, this.meanAttrs[key])
      }

      // render sd
      const sd = graphContainer.append('path')
        .data( [this.polarData] )
        .attr('d', sdRadial)

      for (const key in this.sdAttrs) {
        sd.attr(key, this.sdAttrs[key])
      }

      // render marking cricle
      for (const rTick of linearScale.ticks(5).slice(1)) {
        graphContainer.append('circle')
          .attr('r', linearScale(rTick))
          .attr('stroke-width', '1px')
          .attr('stroke-dasharray', '1,4')
          .attr('fill', 'none')
          .attr('stroke', 'rgba(150, 150, 150, 1.0)')

        // render tick markings for marking circle
        graphContainer.append('text')
          .attr('font-family', this.fontFamily)
          .attr('fill', 'rgba(100, 100, 100, 1.0)')
          .attr('dominant-baseline', 'middle')
          .style('text-anchor', 'end')
          .attr('font-size', 'smaller')
          .attr('transform', `translate(-10, -${linearScale(rTick)})`)
          .text(rTick)
      }

      // append radial guide lines
      const receptors = this.polarData.map(({ receptor }) => {
        const { label: cLabel } = receptor
        const found = this.metadata.find(({ receptor: mReceptor }) => mReceptor.label === cLabel)
        return found && found.receptor || null
      })

      const radialGuideLines = graphContainer.selectAll('g')
        .data( receptors.map(PolarSvg.GenerateLabel) )
        .enter()
          .append('g')
            .attr('transform', (_receptor, index, array) => `rotate(-${ 360 / array.length * index + 90})`)
      
      radialGuideLines
        .append('line')
          .attr('stroke-width', '1px')
          .attr('stroke', 'rgba(200, 200, 200, 1.0)')
          .attr('stroke-dasharray', '8,2')
          .attr('x2', this.diameter / 2)

      radialGuideLines
        .append('g')
          .attr('transform', (svg, index, array) => {
            const { label } = svg
            
            const translateX = this.diameter / 2
            return `translate(${translateX}, 0)`
          })
          .append('g')
            .attr('width', (svg, index, array) => {
              return 0
            })
            .attr(`transform`, (svg, index, array) => {
              const { width, height } = svg
              const rot = 360 / array.length * index + 90
              const flip = rot > 90 && rot < 270
              const w = Number(width.replace('ex', '')) * fudgeFactor
              const h = Number(height.replace('ex', '')) * fudgeFactor / 2
              const translateTxt = flip ? `translate(-${w}, -${h})` : `translate(0, -${h})`
              return `rotate(${1 * rot}) ${translateTxt}`
            })
            .html(({label}) => label)


      // append legends
      const lCongainer = svg.append('g')
        .attr('transform', `translate(0, -40)`)


      const keys = Object.keys(this.polarData[0].density)
      const meanLabel = keys[0]
      const sdLabel = keys[1]
      const unit = this.polarData[0].density[keys[2]]

      // mean legend
      const lc1 = lCongainer.append('g')
      const meanRect = lc1.append('rect')
        .attr('width', 38)
        .attr('height', 16)

      for (const key in this.meanAttrs) {
        meanRect.attr(key, this.meanAttrs[key])
      }

      lc1.append('text')
        .attr('font-family', this.fontFamily)
        .attr('x', 45)
        .attr('y', 10)
        .text(`${meanLabel} (${unit})`)


      const lc2 = lCongainer.append('g')
        .attr('transform', `translate(0, 20)`)

      const sdRect = lc2.append('rect')
        .attr('width', 38)
        .attr('height', 16)

      for (const key in this.sdAttrs) {
        sdRect.attr(key, this.sdAttrs[key])
      }

      lc2.append('text')
        .attr('font-family', this.fontFamily)
        .attr('x', 45)
        .attr('y', 10)
        .text(`${sdLabel} (${unit})`)

      return svgMain.node().outerHTML
    }
  }

  class LinearSvg extends BaseSvg{
    constructor(data, config){
      super(config)
      this.linearData = data.map(({ density }, idx) => [idx, Number(density)])
      const { xAxis, yAxis } = config || {}
      this.xAxis = xAxis
      this.yAxis = yAxis
    }

    generateSvg(){
      const scaleX = d3.scaleLinear().range([0, this.clientWidth])
      const scaleY = d3.scaleLinear().range([this.clientHeight, 0])
      const svgMain = d3.select(this.document.body)
        .append('svg')
          .attr('xmlns', 'http://www.w3.org/2000/svg')
          .style('background-color', 'white')
          .attr('width', this.width)
          .attr('height', this.height)
      const svg = svgMain
        .append('g')
          .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)

      const extents = d3.transpose(
        d3.extent(this.linearData)
      )

      scaleX.domain( [0 , extents[0][1] + 5] )
      scaleY.domain([ 0, d3.max( this.linearData.map(v => v[1]) ) ])

      const area = d3.area()
        .x(d => scaleX(d[0]))
        .y0(this.clientHeight)
        .y1(d => scaleY(d[1]))

      const line = d3.line()
        .x(d => scaleX(d[0]))
        .y(d => scaleY(d[1]))

      svg.append('path')
        .attr('fill', `rgba(200, 200, 200, 1.0)`)
        .data( [this.linearData] )
        .attr('d', area)
      
      svg.append('path')
        .attr('fill', 'none')
        .attr('stroke-width', '1px')
        .attr('stroke', `rgba(100,100,100,1.0)`)
        .data( [this.linearData] )
        .attr('d', line)

      svg.append('g')
        .attr('transform', `translate(0, ${this.clientHeight})`)
        .call(d3.axisBottom(scaleX))

      svg.append('g')
        .call(d3.axisLeft(scaleY))

      // append xaxis label

      if (this.xAxis) {
        const { label } = this.xAxis || {}
        const labelGroup = this.appendLabel(svg, label)
        labelGroup.attr('transform', `translate(${this.clientWidth / 2}, ${this.clientHeight + 35})`)
      }

      // append yaxis label

      if(this.yAxis) {
        const { label } = this.yAxis || {}
        const labelGroup = this.appendLabel(svg, label)
        labelGroup.attr('transform', `translate(-35, ${this.clientHeight / 2 }) rotate(-90)`)
      }

      return svgMain.node().outerHTML
    }
  }

  const parseReceptorMetadata = tsv => d3.tsvParse(tsv, data => {
    return {
      receptor: {
        label: data['receptor (label)'],
        latex: data['receptor (label_latex)'],
        markdown: data['receptor (label_markdown)'],
        fullname: data['receptor (full name)'],
      },
      neurotransmitter: {
        label: data['neurotransmitter (label)'],
        latex: data['neurotransmitter (label_latex)'],
        markdown: data['neurotransmitter (label_markdown)'],
        fullname: data['neurotransmitter (full name)'],
      }
    }
  })

  const parseFingerprint= tsv => d3.tsvParse(tsv, data => {
    const key = Object.keys(data).find(key => /receptor label/i.test(key))
    return {
      receptor: {
        label: data[key]
      },
      density: {
        mean: data['density (mean)'],
        sd: data['density (sd)'],
        unit: data['density (unit)']
      }
    }
  })

  const parseReceptorProfile = tsv => d3.tsvParse(tsv, data => {
    return {
      corticalDepth: data['cortical depth (value)'],
      corticalDepthUnit: data['cortical depth (unit)'],
      density: data['receptor density (value)'],
      densityUnit: data[`receptor density (unit)`],
    }
  })

  exports.weave = (d3Lib, mathjaxLib = null) => {
    if (!d3Lib) throw new Error(`need to pass d3 instance`)
    if (mathjaxLib){
      if (!mathjaxLib.tex2svg) {
        console.warn(`mathjax is provided, but texToSvg method is not defined!`)
      } else if (typeof mathjaxLib.tex2svg !== 'function') {
        console.warn(`mathjax is provided, texToSvg is defined, but is not a function!`)
      } else {
        console.log(`math jax provied. will render latex`)
        mathjax = mathjaxLib 
      }
    }
    d3 = d3Lib
    return {
      parseReceptorMetadata,
      parseFingerprint,
      parseReceptorProfile,
      LinearSvg,
      PolarSvg,
    }
  }

})(typeof exports === 'undefined' ? typeof module === 'undefined' ? window : module.exports : exports)
