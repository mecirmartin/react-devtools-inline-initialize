import * as React from "react"
import { Fragment, useContext, useMemo, useState, useEffect } from "react"
//@ts-ignore
import devtools from "@iteria-app/react-devtools-inline/dist"

import type { ItemData } from "./Tree"
import type { Element } from "./types"
import "./Element.css"

//import { exit } from "ionicons/icons"

type Props = {
  data: ItemData
  index: number
  style: Object
}

const { Store } = devtools
//console.log("devtools", devtools)

const doesElementHaveSource = (id: number) => {
  const devtoolsHook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__
  const rendererInterface = (devtoolsHook?.reactDevtoolsAgent as any)
    ?._rendererInterfaces["1"]

  const path = rendererInterface?.getPathForElement(id)
  const data = rendererInterface?.inspectElement(1, id, path)

  if (data?.value?.source) {
    return true
  }
  return false
}

export default function ElementView({ data, index, style }: Props) {
  const {
    Badge,
    TreeDispatcherContext,
    TreeStateContext,
    StoreContext,
    ViewElementSourceContext,
  } = devtools

  const store = useContext(StoreContext)
  const viewElementSource = useContext(ViewElementSourceContext)
  const { ownerFlatTree, ownerID, selectedElementID } =
    useContext(TreeStateContext)

  const dispatch = useContext(TreeDispatcherContext)

  const element =
    ownerFlatTree !== null
      ? ownerFlatTree[index]
      : //@ts-ignore
        store.getElementAtIndex(index)

  const [isHovered, setIsHovered] = useState(false)

  const { isNavigatingWithKeyboard, onElementMouseEnter, treeFocused } = data
  const id = element === null ? null : element.id
  const isSelected = selectedElementID === id
  const [hasSource, setHasSource] = useState(doesElementHaveSource(element.id))

  const handleDoubleClick = () => {
    if (id !== null) {
      //@ts-ignore
      dispatch({ type: "SELECT_OWNER", payload: id })
    }
  }

  const handleMouseDown = ({ metaKey }: any) => {
    if (id !== null) {
      //@ts-ignore
      dispatch({
        type: "SELECT_ELEMENT_BY_ID",
        payload: metaKey ? null : id,
      })
    }
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
    if (id !== null) {
      onElementMouseEnter(id)
    }
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
  }

  //@ts-ignore
  const handleKeyDoubleClick = event => {
    // Double clicks on key value are used for text selection (if the text has been truncated).
    // They should not enter the owners tree view.
    event.stopPropagation()
    event.preventDefault()
  }

  useEffect(() => {
    setHasSource(doesElementHaveSource(element.id))
  }, [store])

  // Handle elements that are removed from the tree while an async render is in progress.
  if (element == null) {
    console.warn(`<ElementView> Could not find element at index ${index}`)

    // This return needs to happen after hooks, since hooks can't be conditional.
    return null
  }

  let {
    //@ts-ignore
    depth,
    displayName,
    hocDisplayNames,
    key,
    type,
    //@ts-ignore
  } = element

  let className = "Element"
  if (isSelected) {
    className = "treeFocused" ? "SelectedElement" : "InactiveSelectedElement"
  } else if (isHovered && !isNavigatingWithKeyboard) {
    className = "HoveredElement"
  }
  return (
    <div
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      style={style}
      data-depth={depth}
    >
      {/* This wrapper is used by Tree for measurement purposes. */}
      <div
        className="Wrapper"
        style={{
          // Left offset presents the appearance of a nested tree structure.
          // We must use padding rather than margin/left because of the selected background color.
          transform: `translateX(calc(${depth} * var(--indentation-size)))`,
        }}
      >
        {ownerID === null ? (
          <ExpandCollapseToggle element={element} store={store} />
        ) : null}
        <DisplayName displayName={displayName} id={id} />
        {key && (
          <Fragment>
            &nbsp;<span className="KeyName">key</span>="
            <span
              className="KeyValue"
              title={key}
              onDoubleClick={handleKeyDoubleClick}
            >
              {key}
            </span>
            "
          </Fragment>
        )}
        {hocDisplayNames !== null && hocDisplayNames.length > 0 ? (
          <Badge
            className="Badge"
            hocDisplayNames={hocDisplayNames}
            type={type}
          >
            <DisplayName displayName={hocDisplayNames[0]} id={id} />
          </Badge>
        ) : null}
      </div>
    </div>
  )
}

//@ts-ignore Prevent double clicks on toggle from drilling into the owner list.
const swallowDoubleClick = event => {
  event.preventDefault()
  event.stopPropagation()
}

type ExpandCollapseToggleProps = {
  element: Element
  store: typeof Store
}

function ExpandCollapseToggle({ element, store }: ExpandCollapseToggleProps) {
  const { ButtonIcon } = devtools
  const { children, id, isCollapsed } = element

  const toggleCollapsed = (event: any) => {
    event.preventDefault()
    event.stopPropagation()

    store.toggleIsCollapsed(id, !isCollapsed)
  }

  const stopPropagation = (event: any) => {
    // Prevent the row from selecting
    event.stopPropagation()
  }

  if (children.length === 0) {
    return <div className="ExpandCollapseToggle" />
  }

  return (
    <div
      className="ExpandCollapseToggle"
      onMouseDown={stopPropagation}
      onClick={toggleCollapsed}
      onDoubleClick={swallowDoubleClick}
    >
      <ButtonIcon type={isCollapsed ? "collapsed" : "expanded"} />
    </div>
  )
}

type DisplayNameProps = {
  displayName: string | null
  id: number
}

const DisplayName: React.FC<DisplayNameProps> = ({
  displayName,
  id,
}: DisplayNameProps): any => {
  const { createRegExp, TreeStateContext } = devtools
  const { searchIndex, searchResults, searchText } =
    useContext(TreeStateContext)
  const isSearchResult = useMemo(() => {
    return searchResults.includes(id)
  }, [id, searchResults])
  const isCurrentResult =
    searchIndex !== null && id === searchResults[searchIndex]

  if (!isSearchResult || displayName === null) {
    return displayName
  }

  const match = createRegExp(searchText).exec(displayName)

  if (match === null) {
    return displayName
  }

  const startIndex = match.index
  const stopIndex = startIndex + match[0].length

  const children = []
  if (startIndex > 0) {
    children.push(<span key="begin">{displayName.slice(0, startIndex)}</span>)
  }
  children.push(
    <mark
      key="middle"
      className={isCurrentResult ? "CurrentHighlight" : "Highlight"}
    >
      {displayName.slice(startIndex, stopIndex)}
    </mark>
  )
  if (stopIndex < displayName.length) {
    children.push(<span key="end">{displayName.slice(stopIndex)}</span>)
  }

  return children
}
