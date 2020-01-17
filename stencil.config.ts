import { Config } from '@stencil/core';
import replace from '@rollup/plugin-replace'

export const config: Config = {
  namespace: 'kg-dataset-previewer',
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: '../loader'
    },
    {
      type: 'docs-readme'
    },
    {
      type: 'www',
      serviceWorker: null // disable service workers
    }
  ],
  plugins: [
    replace({
      __BACKEND_URL__: process.env.KG_DATASET_PREVIEWER_BACKEND_URL || `https://hbp-kg-dataset-previewer.apps.hbp.eu/datasetPreview`
    })
  ]
};
