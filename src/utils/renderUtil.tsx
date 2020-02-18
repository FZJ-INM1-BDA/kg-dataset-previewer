export interface IDatasetFile{
  filename: string
  name: string
  mimetype: string
  properties: any
  url?: string
  data? :any
}
import { h } from '@stencil/core'
import { MIME_TYPE } from './utils'

// TODO check for XSS
export function getRenderList({ containerClass, itemClass } = { itemClass: '', containerClass: ''}){
  return function renderList(files: IDatasetFile[]) {
    return <ul class={containerClass}>
      {files.map(({ filename }) => <li class={itemClass}>{ filename }</li>)}
    </ul>
  }
}

function renderLinkAsAnchor(link: string, text: string = 'Click here'){
  return <a href={link}>{text}</a>
}

// TODO check for XSS
export function getRenderFunction({ itemClass, darkmode = false }: {itemClass?: string, darkmode?: boolean} = { itemClass: '', darkmode: false }){
  return function renderDatasetPreview(datafile: IDatasetFile){
    const { mimetype, url, data } = datafile
    switch (mimetype){
      case MIME_TYPE.NIFTI: {
        return <span class={itemClass}>nifti can be visited at: {url}</span>
      }
      case MIME_TYPE.JPEG: {
        return <div class={(itemClass || '') + ' img-container-cls'} style={{background: `url('${url}') center center / contain no-repeat`}} data-img-src={url}></div>
      }
      case MIME_TYPE.JSON: {
        return <kg-dataset-previewer-chart
          style={{width: '100%', height: '100%', display: 'block'}}
          darkmode={darkmode}
          dataProp={JSON.stringify(data)} />
      }
      case MIME_TYPE.HIBOP: {
        const { url, filename } = datafile
        if (!url) return <span class={itemClass}>HiBoP file does not have URL defined.</span>
        return <div class={itemClass}>
          <div>
            {renderLinkAsAnchor(url, `View ${filename} in HiBoP`)}
          </div>
          <div>
            You need to have HiBoP and Binxy installed.
          </div>
        </div>
      }
      default: return <span>MIMETYPE {mimetype} does not have a renderer.</span>
    }
  }
}

function removeTraillingSlash(str) {
  return str.replace(/\/$/, '')
}

function removeLeadingSlash(str) {
  return str.replace(/^\//, '')
}

export function prependUrl({ backendUrl, url }) {
  return /^[a-z]{1,}:\/\//.test(url)
    ? url
    : `${removeTraillingSlash(backendUrl)}/${removeLeadingSlash(url)}`
}