import {
  initialize as initializeBackend,
  activate as activateBackend,
  //@ts-ignore
} from "react-devtools-inline/backend"
//@ts-ignore
import { initialize as initializeFrontend } from "react-devtools-inline/frontend"

import { showDevtoolsWarning } from "./warning"

declare global {
  interface Window {
    __REACT_DEVTOOLS_GLOBAL_HOOK__: any
  }
}

if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers.size === 0) {
  console.log("delete devtools", window.__REACT_DEVTOOLS_GLOBAL_HOOK__)
  delete window.__REACT_DEVTOOLS_GLOBAL_HOOK__
} else if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers.size > 0) {
  console.log("show warning devtools", window.__REACT_DEVTOOLS_GLOBAL_HOOK__)
  showDevtoolsWarning()
}

initializeBackend(window)
initializeFrontend(window)
activateBackend(window)
