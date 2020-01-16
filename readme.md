# KG Dataset Previewer

This repository builds web components using [stenciljs.com](https://stenciljs.com/)

The webcomponents can be used to visualise a few manually curated datasets.

# Usage

## `<kg-dataset-list />`
```html
<kg-dataset-list
  kg-ds-prv-kg-schema="minds/core/dataset/v1.0.0"
  kg-ds-prv-kg-id="a5589ffe-5148-4006-8d8d-8bcf411f750b"
  kg-ds-prv-backend-url="http://localhost:1234/datasetPreview"
  kg-ds-prv-container-class="container-class my-ul-class"
  kg-ds-prv-item-class="item-class my-li-class">
</kg-dataset-list>
```
renders `ul.container-class.my-ul-class>li.item-class.my-li-class`

```html
<kg-dataset-list>
  <ul class="container-class my-ul-class">
    <li class="item-class my-li-class">
      Area TE 2.1 (STG) [v5.1, Colin 27, right hemisphere]
    </li>
    <li class="item-class my-li-class">
      Area TE 2.1 (STG) [v5.1, Colin 27, left hemisphere]
    </li>
    <li class="item-class my-li-class">
      Area TE 2.1 (STG) [v5.1, ICBM 2009c Asymmetric, left hemisphere]
    </li>
    <li class="item-class my-li-class">
      Area TE 2.1 (STG) [v5.1, ICBM 2009c Asymmetric, right hemisphere]
    </li>
  </ul>
</kg-dataset-list>
```

With the attributes:

| name | required | default |
| --- | --- | --- |
| kg-ds-prv-kg-schema       |     | `minds/core/dataset/v1.0.0` |
| kg-ds-prv-kg-id           | yes | |
| kg-ds-prv-backend-url     |     | `http://localhost:1234/datasetPreview` |
| kg-ds-prv-container-class |     | |
| kg-ds-prv-item-class      |     | |

## `<kg-dataset-previewer />`

```html
<kg-dataset-previewer
  kg-ds-prv-kg-schema="minds/core/dataset/v1.0.0"
  kg-ds-prv-kg-id="a5589ffe-5148-4006-8d8d-8bcf411f750b"
  kg-ds-prv-backend-url="http://localhost:1234/datasetPreview"
  kg-ds-prv-filename="Area TE 2.1 (STG) [v5.1, Colin 27, right hemisphere]">

</kg-dataset-previewer>
```



# License

MIT
