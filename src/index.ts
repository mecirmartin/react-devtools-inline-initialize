import {
  initialize as initializeBackend,
  activate as activateBackend,
  //@ts-ignore
} from 'react-devtools-inline/backend'
//@ts-ignore
import { initialize as initializeFrontend } from 'react-devtools-inline/frontend'
import { Store } from './bridgeOperations'

import { showDevtoolsWarning } from './warning'

declare global {
  interface Window {
    __REACT_DEVTOOLS_GLOBAL_HOOK__: any
  }
}

if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers.size === 0) {
  console.log('delete devtools', window.__REACT_DEVTOOLS_GLOBAL_HOOK__)
  delete window.__REACT_DEVTOOLS_GLOBAL_HOOK__
} else if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers.size > 0) {
  console.log('show warning devtools', window.__REACT_DEVTOOLS_GLOBAL_HOOK__)
  showDevtoolsWarning()
}

const store = new Store()
window.addEventListener('message', ({ data }) => {
  if (data.event === 'operations') {
    store.onBridgeOperations(data.payload)
    const devtoolsTree = store._idToElement
    //@ts-ignore
    window.devtoolsTree = devtoolsTree
  }
})

initializeBackend(window)
initializeFrontend(window)
activateBackend(window)
