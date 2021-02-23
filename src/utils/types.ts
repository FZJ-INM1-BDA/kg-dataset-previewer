export type TReceptorCommon = {
  latex: string
  markdown: string
  name: string
}

type TReceptor = string // TODO complete all possible neuroreceptor

export type TReceptorSymbol = {
  [key: string]: {
    receptor: TReceptorCommon,
    neurotransmitter: TReceptorCommon & { label: string }
  }
}

export type TProfile = {
  [key: number]: number
}

type THasName = {
  name: string
}

export type TBSFingerprint = {
  unit: string
  labels: TReceptor[]
  meanvals: number[]
  stdvals: number[]
  n: 1
}

export type TBSData = {
  "region": string
  "active": boolean
  "name": string
  "urls": string[] // array of urls
  "info": string // md of desc of dataset
  "modality": THasName[]
  "_ReceptorDistribution__profiles": {
    [key: string]: TProfile
  } // key is receptor key
  "_ReceptorDistribution__autoradiographs": {
    [key: string]: string
  } // value is tiff image URL
  "_ReceptorDistribution__fingerprint": TBSFingerprint
  "_ReceptorDistribution__profile_unit": string
}

export type TBSResp = {
  data: any
  receptor_symbols: TReceptorSymbol
}

export type TOriginalProfileDataType = any[] & {
  columns: string[]
}

export type TOriginalFPDataType = {
  receptor: {
    label: TReceptor
  }
  density: {
    mean: string
    sd: string
    unit: string
  }
}

type TOriginalMiniMetadata = {
  fullname: string
  label: string
  latex: string
  markdown: string
}

export type TOriginalMetadata = {
  neurotransmitter: TOriginalMiniMetadata
  receptor: TOriginalMiniMetadata
}

export type TGuideLineOpts = {
  
}