import "@reach/menu-button/styles.css"
import "@reach/tooltip/styles.css"

import * as React from "react"
import { useEffect, useLayoutEffect, useMemo, useRef } from "react"

//@ts-ignore
import devtools from "@iteria-app/react-devtools-inline/dist"
import Components from "./Components"
import "./DevTools.css"

const { InspectedElement, FrontendBridge, Store } = devtools

export type BrowserTheme = "dark" | "light"
export type TabID = "components" | "profiler"
export type ViewElementSource = (
  id: number,
  inspectedElement: typeof InspectedElement
) => void
export type ViewAttributeSource = (
  id: number,
  path: Array<string | number>
) => void
export type CanViewElementSource = (
  inspectedElement: typeof InspectedElement
) => boolean

export type Props = {
  bridge: typeof FrontendBridge
  browserTheme?: BrowserTheme
  canViewElementSourceFunction?: CanViewElementSource
  defaultTab?: TabID
  enabledInspectedElementContextMenu?: boolean
  showTabBar?: boolean
  store: typeof Store
  warnIfLegacyBackendDetected?: boolean
  warnIfUnsupportedVersionDetected?: boolean
  viewAttributeSourceFunction?: ViewAttributeSource
  viewElementSourceFunction?: ViewElementSource

  // This property is used only by the web extension target.
  // The built-in tab UI is hidden in that case, in favor of the browser's own panel tabs.
  // This is done to save space within the app.
  // Because of this, the extension needs to be able to change which tab is active/rendered.
  overrideTab?: TabID

  // To avoid potential multi-root trickiness, the web extension uses portals to render tabs.
  // The root <DevTools> app is rendered in the top-level extension window,
  // but individual tabs (e.g. Components, Profiling) can be rendered into portals within their browser panels.
  componentsPortalContainer?: Element
  profilerPortalContainer?: Element
}

const componentsTab = {
  id: "components",
  icon: "components",
  label: "Components",
  title: "React Components",
}
const profilerTab = {
  id: "profiler",
  icon: "profiler",
  label: "Profiler",
  title: "React Profiler",
}
const tabs = [componentsTab, profilerTab]

export const DevTools: React.FC<Props> = ({
  bridge,
  browserTheme = "light",
  canViewElementSourceFunction,
  componentsPortalContainer,
  defaultTab = "components",
  enabledInspectedElementContextMenu = false,
  overrideTab,
  profilerPortalContainer,
  showTabBar = false,
  store,
  warnIfLegacyBackendDetected = false,
  warnIfUnsupportedVersionDetected = false,
  viewAttributeSourceFunction,
  viewElementSourceFunction,
}: Props) => {
  const {
    BridgeContext,
    ContextMenuContext,
    StoreContext,
    useLocalStorage,
    SettingsContextController,
    ModalDialogContextController,
    TabBar,
    TreeContextController,
    ViewElementSourceContext,
    ReactLogo,
    UnsupportedVersionDialog,
    WarnIfLegacyBackendDetected,
  } = devtools

  const [currentTab, setTab] = useLocalStorage<TabID>(
    "React::DevTools::defaultTab",
    defaultTab
  )
  let tab = currentTab

  if (overrideTab != null) {
    tab = overrideTab
  }

  const viewElementSource = useMemo(
    () => ({
      canViewElementSourceFunction: canViewElementSourceFunction || null,
      viewElementSourceFunction: viewElementSourceFunction || null,
    }),
    [canViewElementSourceFunction, viewElementSourceFunction]
  )

  const contextMenu = useMemo(
    () => ({
      isEnabledForInspectedElement: enabledInspectedElementContextMenu,
      viewAttributeSourceFunction: viewAttributeSourceFunction || null,
    }),
    [enabledInspectedElementContextMenu, viewAttributeSourceFunction]
  )

  const devToolsRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!showTabBar) {
      return
    }

    const div = devToolsRef.current
    if (div === null) {
      return
    }

    const ownerWindow = div.ownerDocument.defaultView
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case "1":
            //@ts-ignore
            setTab(tabs[0].id)
            event.preventDefault()
            event.stopPropagation()
            break
          case "2":
            //@ts-ignore
            setTab(tabs[1].id)
            event.preventDefault()
            event.stopPropagation()
            break
        }
      }
    }
    ownerWindow?.addEventListener("keydown", handleKeyDown)
    return () => {
      ownerWindow?.removeEventListener("keydown", handleKeyDown)
    }
  }, [showTabBar])

  useLayoutEffect(() => {
    return () => {
      try {
        // Shut the Bridge down synchronously (during unmount).
        bridge.shutdown()
      } catch (error) {
        // Attempting to use a disconnected port.
      }
    }
  }, [bridge])

  return (
    <BridgeContext.Provider value={bridge}>
      <StoreContext.Provider value={store}>
        <ContextMenuContext.Provider value={contextMenu}>
          <ModalDialogContextController>
            <SettingsContextController
              browserTheme={browserTheme}
              componentsPortalContainer={componentsPortalContainer}
              profilerPortalContainer={profilerPortalContainer}
            >
              <ViewElementSourceContext.Provider value={viewElementSource}>
                <TreeContextController>
                  <div className="DevTools" ref={devToolsRef}>
                    {showTabBar && (
                      <div className="TabBar">
                        <ReactLogo />
                        <span className="DevToolsVersion">
                          {/* @ts-ignore */}
                          {process.env.DEVTOOLS_VERSION}
                        </span>
                        <div className="Spacer" />
                        <TabBar
                          currentTab={tab}
                          id="DevTools"
                          selectTab={setTab}
                          tabs={tabs}
                          type="navigation"
                        />
                      </div>
                    )}
                    <div className="TabContent" hidden={tab !== "components"}>
                      <Components portalContainer={componentsPortalContainer} />
                    </div>
                  </div>
                </TreeContextController>
              </ViewElementSourceContext.Provider>
            </SettingsContextController>
            {warnIfLegacyBackendDetected && <WarnIfLegacyBackendDetected />}
            {warnIfUnsupportedVersionDetected && <UnsupportedVersionDialog />}
          </ModalDialogContextController>
        </ContextMenuContext.Provider>
      </StoreContext.Provider>
    </BridgeContext.Provider>
  )
}

export default DevTools
