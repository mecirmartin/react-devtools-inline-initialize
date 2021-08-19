import { forwardRef } from "react"
//@ts-ignore
import devtools from "@iteria-app/react-devtools-inline/dist"
//TODO import DevTools from "./DevTools"
//@ts-ignore
import Devtools from "./DevTools"

export function initialize(contentWindow: Window) {
  const onGetSavedPreferencesMessage = ({ data, source }: any) => {
    if (source === "react-devtools-content-script") {
      // Ignore messages from the DevTools browser extension.
    }
    console.log(devtools)
    switch (data.type) {
      case devtools.MESSAGE_TYPE_GET_SAVED_PREFERENCES:
        // This is the only message we're listening for,
        // so it's safe to cleanup after we've received it.
        window.removeEventListener("message", onGetSavedPreferencesMessage)

        // The renderer interface can't read saved preferences directly,
        // because they are stored in localStorage within the context of the extension.
        // Instead it relies on the extension to pass them through.
        console.log(devtools.getAppendComponentStack(), devtools)
        contentWindow.postMessage(
          {
            type: devtools.MESSAGE_TYPE_SAVED_PREFERENCES,
            appendComponentStack: devtools.getAppendComponentStack(),
            breakOnConsoleErrors: devtools.getBreakOnConsoleErrors(),
            componentFilters: devtools.getSavedComponentFilters(),
          },
          "*"
        )
        break
      default:
        break
    }
  }

  window.addEventListener("message", onGetSavedPreferencesMessage)

  const bridge = new devtools.Bridge({
    listen(fn: Function) {
      const onMessage = ({ data }: any) => {
        // console.log("listen", data)
        fn(data)
      }
      window.addEventListener("message", onMessage)
      return () => {
        window.removeEventListener("message", onMessage)
      }
    },
    send(event: string, payload: any, transferable?: Array<any>) {
      contentWindow.postMessage({ event, payload }, "*", transferable)
      // console.log("post", event, payload, transferable)
    },
  })

  const store = new devtools.Store(bridge, { supportsTraceUpdates: true })

  const ForwardRef = forwardRef<any, any>((props, ref) => (
    // @ts-ignore
    <Devtools ref={ref} bridge={bridge} store={store} {...props} />
  ))
  ForwardRef.displayName = "DevTools"

  return ForwardRef
}
