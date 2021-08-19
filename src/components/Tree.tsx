import * as React from 'react';
import {
  Fragment,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
//@ts-ignore
import AutoSizer from 'react-virtualized-auto-sizer';
//@ts-ignore
import { FixedSizeList } from 'react-window';

//@ts-ignore
import devtools from "@iteria-app/react-devtools-inline/dist"
import ElementView from "./Element"
import './Tree.css';

// Never indent more than this number of pixels (even if we have the room).
const DEFAULT_INDENTATION_SIZE = 12;

export type ItemData = {
  numElements: number,
  isNavigatingWithKeyboard: boolean,
  lastScrolledIDRef: { current: number | null },
  onElementMouseEnter: (id: number) => void,
  treeFocused: boolean,
};

type Props = {};

export default function Tree(props: Props) {
  const { TreeDispatcherContext, TreeStateContext, BridgeContext, StoreContext, useHighlightNativeElement, SettingsContext, InspectHostNodesToggle, OwnersStack, SearchInput, SettingsModalContextToggle, TreeFocusedContext } = devtools
  const dispatch = useContext(TreeDispatcherContext);
  const {
    numElements,
    ownerID,
    searchIndex,
    searchResults,
    selectedElementID,
    selectedElementIndex,
  } = useContext(TreeStateContext);
  const bridge = useContext(BridgeContext);
  const store = useContext(StoreContext);
  const [isNavigatingWithKeyboard, setIsNavigatingWithKeyboard] = useState(
    false,
  );
  const {
    highlightNativeElement,
    clearHighlightNativeElement,
  } = useHighlightNativeElement();
  const treeRef = useRef<HTMLDivElement | null>(null);
  const focusTargetRef = useRef<HTMLDivElement | null>(null);

  const [treeFocused, setTreeFocused] = useState<boolean>(false);

  const { lineHeight } = useContext(SettingsContext);


  // Make sure a newly selected element is visible in the list.
  // This is helpful for things like the owners list and search.
  //
  // TRICKY:
  // It's important to use a callback ref for this, rather than a ref object and an effect.
  // As an optimization, the AutoSizer component does not render children when their size would be 0.
  // This means that in some cases (if the browser panel size is initially really small),
  // the Tree component might render without rendering an inner List.
  // In this case, the list ref would be null on mount (when the scroll effect runs),
  // meaning the scroll action would be skipped (since ref updates don't re-run effects).
  // Using a callback ref accounts for this case...
  const listCallbackRef = useCallback(
    list => {
      if (list != null && selectedElementIndex !== null) {
        list.scrollToItem(selectedElementIndex, 'smart');
      }
    },
    [selectedElementIndex],
  );

  // Picking an element in the inspector should put focus into the tree.
  // This ensures that keyboard navigation works right after picking a node.
  useEffect(() => {
    function handleStopInspectingNative(didSelectNode: any) {
      if (didSelectNode && focusTargetRef.current !== null) {
        focusTargetRef.current.focus();
      }
    }
    //@ts-ignore
    bridge.addListener('stopInspectingNative', handleStopInspectingNative);
    return () =>
      //@ts-ignore
      bridge.removeListener('stopInspectingNative', handleStopInspectingNative);
  }, [bridge]);

  // This ref is passed down the context to elements.
  // It lets them avoid autoscrolling to the same item many times
  // when a selected virtual row goes in and out of the viewport.
  const lastScrolledIDRef = useRef<number | null>(null);

  // Navigate the tree with up/down arrow keys.
  useEffect(() => {
    if (treeRef.current === null) {
      return () => { };
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      //@ts-ignore
      if (event.target.tagName === 'INPUT' || event.defaultPrevented) {
        return;
      }

      // TODO We should ignore arrow keys if the focus is outside of DevTools.
      // Otherwise the inline (embedded) DevTools might change selection unexpectedly,
      // e.g. when a text input or a select has focus.

      let element;
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          if (event.altKey) {
            //@ts-ignore
            dispatch({ type: 'SELECT_NEXT_SIBLING_IN_TREE' });
          } else {
            //@ts-ignore
            dispatch({ type: 'SELECT_NEXT_ELEMENT_IN_TREE' });
          }
          break;
        case 'ArrowLeft':
          event.preventDefault();
          element =
            selectedElementID !== null
              //@ts-ignore
              ? store.getElementByID(selectedElementID)
              : null;
          if (element !== null) {
            if (event.altKey) {
              if (element.ownerID !== null) {
                //@ts-ignore
                dispatch({ type: 'SELECT_OWNER_LIST_PREVIOUS_ELEMENT_IN_TREE' });
              }
            } else {
              if (element.children.length > 0 && !element.isCollapsed) {
                //@ts-ignore
                store.toggleIsCollapsed(element.id, true);
              } else {
                //@ts-ignore
                dispatch({ type: 'SELECT_PARENT_ELEMENT_IN_TREE' });
              }
            }
          }
          break;
        case 'ArrowRight':
          event.preventDefault();
          element =
            selectedElementID !== null
              //@ts-ignore
              ? store.getElementByID(selectedElementID)
              : null;
          if (element !== null) {
            if (event.altKey) {
              //@ts-ignore
              dispatch({ type: 'SELECT_OWNER_LIST_NEXT_ELEMENT_IN_TREE' });
            } else {
              if (element.children.length > 0 && element.isCollapsed) {
                //@ts-ignore
                store.toggleIsCollapsed(element.id, false);
              } else {
                //@ts-ignore
                dispatch({ type: 'SELECT_CHILD_ELEMENT_IN_TREE' });
              }
            }
          }
          break;
        case 'ArrowUp':
          event.preventDefault();
          if (event.altKey) {
            //@ts-ignore
            dispatch({ type: 'SELECT_PREVIOUS_SIBLING_IN_TREE' });
          } else {
            //@ts-ignore
            dispatch({ type: 'SELECT_PREVIOUS_ELEMENT_IN_TREE' });
          }
          break;
        default:
          return;
      }
      setIsNavigatingWithKeyboard(true);
    };

    // It's important to listen to the ownerDocument to support the browser extension.
    // Here we use portals to render individual tabs (e.g. Profiler),
    // and the root document might belong to a different window.
    const ownerDocument = treeRef.current.ownerDocument;
    ownerDocument.addEventListener('keydown', handleKeyDown);

    return () => {
      ownerDocument.removeEventListener('keydown', handleKeyDown);
    };
  }, [dispatch, selectedElementID, store]);

  // Focus management.
  const handleBlur = useCallback(() => setTreeFocused(false), []);
  const handleFocus = useCallback(() => {
    setTreeFocused(true);

    if (selectedElementIndex === null && numElements > 0) {
      //@ts-ignore
      dispatch({
        type: 'SELECT_ELEMENT_AT_INDEX',
        payload: 0,
      });
    }
  }, [dispatch, numElements, selectedElementIndex]);

  const handleKeyPress = useCallback(
    event => {
      switch (event.key) {
        case 'Enter':
        case ' ':
          if (selectedElementID !== null) {
            //@ts-ignore
            dispatch({ type: 'SELECT_OWNER', payload: selectedElementID });
          }
          break;
        default:
          break;
      }
    },
    [dispatch, selectedElementID],
  );

  // If we switch the selected element while using the keyboard,
  // start highlighting it in the DOM instead of the last hovered node.
  const searchRef = useRef({ searchIndex, searchResults });
  useEffect(() => {
    let didSelectNewSearchResult = false;
    if (
      searchRef.current.searchIndex !== searchIndex ||
      searchRef.current.searchResults !== searchResults
    ) {
      searchRef.current.searchIndex = searchIndex;
      searchRef.current.searchResults = searchResults;
      didSelectNewSearchResult = true;
    }
    if (isNavigatingWithKeyboard || didSelectNewSearchResult) {
      if (selectedElementID !== null) {
        highlightNativeElement(selectedElementID);
      } else {
        clearHighlightNativeElement();
      }
    }
  }, [
    bridge,
    isNavigatingWithKeyboard,
    highlightNativeElement,
    searchIndex,
    searchResults,
    selectedElementID,
  ]);

  interface TreeObject {
    currentID: number
    children: Array<number>
    parentID: number
    ownerID: number
  }

  useEffect(() => {
    //@ts-ignore
    if (store._idToElement.size > 0) {
      const map = new Map<number, TreeObject>();
      //@ts-ignore
      store._idToElement.forEach((key, value) => {
        let entries = {
          currentID: key.id,
          children: key.children,
          parentID: key.parentID,
          ownerID: key.ownerID,
        }
        map.set(value, entries)
      })
      //log(map)
      localStorage.myTree = JSON.stringify(Array.from(map.entries()));
    }
    //@ts-ignore
  }, [store._idToElement.size])

  // Highlight last hovered element.
  const handleElementMouseEnter = useCallback(
    id => {
      // Ignore hover while we're navigating with keyboard.
      // This avoids flicker from the hovered nodes under the mouse.
      if (!isNavigatingWithKeyboard) {
        highlightNativeElement(id);
      }
    },
    [isNavigatingWithKeyboard, highlightNativeElement],
  );

  const handleMouseMove = useCallback(() => {
    // We started using the mouse again.
    // This will enable hover styles in individual rows.
    setIsNavigatingWithKeyboard(false);
  }, []);

  const handleMouseLeave = clearHighlightNativeElement;

  // Let react-window know to re-render any time the underlying tree data changes.
  // This includes the owner context, since it controls a filtered view of the tree.
  const itemData = useMemo<ItemData>(
    () => ({
      numElements,
      isNavigatingWithKeyboard,
      onElementMouseEnter: handleElementMouseEnter,
      lastScrolledIDRef,
      treeFocused,
    }),
    [
      numElements,
      isNavigatingWithKeyboard,
      handleElementMouseEnter,
      lastScrolledIDRef,
      treeFocused,
    ],
  );

  const itemKey = useCallback(
    //@ts-ignore
    (index: number) => store.getElementIDAtIndex(index),
    [store],
  );

  return (
    <TreeFocusedContext.Provider value={treeFocused}>
      <div className="Tree" ref={treeRef}>
        <div className="SearchInput">
          {
            //@ts-ignore
            store.supportsNativeInspection && (
              <Fragment>
                <InspectHostNodesToggle />
                <div className="VRule" />
              </Fragment>
            )}
          <Suspense fallback={<Loading />}>
            {ownerID !== null ? <OwnersStack /> : <SearchInput />}
          </Suspense>
          <div className="VRule" />
          <SettingsModalContextToggle />
        </div>
        <div
          className="AutoSizerWrapper"
          onBlur={handleBlur}
          onFocus={handleFocus}
          onKeyPress={handleKeyPress}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          ref={focusTargetRef}
          tabIndex={0}>
          <AutoSizer>
            {({ height, width }: any) => (
              // $FlowFixMe https://github.com/facebook/flow/issues/7341
              <FixedSizeList
                className="List"
                height={height}
                innerElementType={InnerElementType}
                itemCount={numElements}
                itemData={itemData}
                itemKey={itemKey}
                itemSize={lineHeight}
                ref={listCallbackRef}
                width={width}>
                {ElementView}
              </FixedSizeList>
            )}
          </AutoSizer>
        </div>
      </div>
    </TreeFocusedContext.Provider>
  );
}

// Indentation size can be adjusted but child width is fixed.
// We need to adjust indentations so the widest child can fit without overflowing.
// Sometimes the widest child is also the deepest in the tree:
//   ┏----------------------┓
//   ┆ <Foo>                ┆
//   ┆ ••••<Foobar>         ┆
//   ┆ ••••••••<Baz>        ┆
//   ┗----------------------┛
//
// But this is not always the case.
// Even with the above example, a change in indentation may change the overall widest child:
//   ┏----------------------┓
//   ┆ <Foo>                ┆
//   ┆ ••<Foobar>           ┆
//   ┆ ••••<Baz>            ┆
//   ┗----------------------┛
//
// In extreme cases this difference can be important:
//   ┏----------------------┓
//   ┆ <ReallyLongName>     ┆
//   ┆ ••<Foo>              ┆
//   ┆ ••••<Bar>            ┆
//   ┆ ••••••<Baz>          ┆
//   ┆ ••••••••<Qux>        ┆
//   ┗----------------------┛
//
// In the above example, the current indentation is fine,
// but if we naively assumed that the widest element is also the deepest element,
// we would end up compressing the indentation unnecessarily:
//   ┏----------------------┓
//   ┆ <ReallyLongName>     ┆
//   ┆ •<Foo>               ┆
//   ┆ ••<Bar>              ┆
//   ┆ •••<Baz>             ┆
//   ┆ ••••<Qux>            ┆
//   ┗----------------------┛
//
// The way we deal with this is to compute the max indentation size that can fit each child,
// given the child's fixed width and depth within the tree.
// Then we take the smallest of these indentation sizes...
function updateIndentationSizeVar(
  innerDiv: HTMLDivElement,
  cachedChildWidths: WeakMap<HTMLElement, number>,
  indentationSizeRef: { current: number },
  prevListWidthRef: { current: number },
): void {
  const list = innerDiv.parentElement;
  const listWidth = list?.clientWidth;

  // Skip measurements when the Components panel is hidden.
  if (!listWidth || listWidth === 0) {
    return;
  }

  // Reset the max indentation size if the width of the tree has increased.
  if (listWidth > prevListWidthRef.current) {
    indentationSizeRef.current = DEFAULT_INDENTATION_SIZE;
  }
  prevListWidthRef.current = listWidth;

  let maxIndentationSize: number = indentationSizeRef.current;

  //@ts-ignore
  for (const child of innerDiv.children) {
    const depth = 1//parseInt(child.getAttribute('data-depth'), 10) || 0;

    let childWidth: number = 0;

    const cachedChildWidth = cachedChildWidths.get(child as any);
    if (cachedChildWidth != null) {
      childWidth = cachedChildWidth;
    } else {
      const { firstElementChild } = child;

      // Skip over e.g. the guideline element
      if (firstElementChild != null) {
        childWidth = firstElementChild.clientWidth;
        cachedChildWidths.set(child as any, childWidth);
      }
    }

    const remainingWidth = Math.max(0, listWidth - childWidth);

    maxIndentationSize = Math.min(maxIndentationSize, remainingWidth / depth);
  }

  indentationSizeRef.current = maxIndentationSize;

  list?.style.setProperty('--indentation-size', `${maxIndentationSize}px`);
}

function InnerElementType({ children, style, ...rest }: any) {
  const { TreeStateContext } = devtools
  const { ownerID } = useContext(TreeStateContext);

  const cachedChildWidths = useMemo<WeakMap<HTMLElement, number>>(
    () => new WeakMap(),
    [],
  );

  // This ref tracks the current indentation size.
  // We decrease indentation to fit wider/deeper trees.
  // We intentionally do not increase it again afterward, to avoid the perception of content "jumping"
  // e.g. clicking to toggle/collapse a row might otherwise jump horizontally beneath your cursor,
  // e.g. scrolling a wide row off screen could cause narrower rows to jump to the right some.
  //
  // There are two exceptions for this:
  // 1. The first is when the width of the tree increases.
  // The user may have resized the window specifically to make more room for DevTools.
  // In either case, this should reset our max indentation size logic.
  // 2. The second is when the user enters or exits an owner tree.
  const indentationSizeRef = useRef<number>(DEFAULT_INDENTATION_SIZE);
  const prevListWidthRef = useRef<number>(0);
  const prevOwnerIDRef = useRef<number | null>(ownerID);
  const divRef = useRef<HTMLDivElement | null>(null);

  // We shouldn't retain this width across different conceptual trees though,
  // so when the user opens the "owners tree" view, we should discard the previous width.
  if (ownerID !== prevOwnerIDRef.current) {
    prevOwnerIDRef.current = ownerID;
    indentationSizeRef.current = DEFAULT_INDENTATION_SIZE;
  }

  // When we render new content, measure to see if we need to shrink indentation to fit it.
  useEffect(() => {
    if (divRef.current !== null) {
      updateIndentationSizeVar(
        divRef.current,
        cachedChildWidths,
        indentationSizeRef,
        prevListWidthRef,
      );
    }
  });

  // This style override enables the background color to fill the full visible width,
  // when combined with the CSS tweaks in Element.
  // A lot of options were considered; this seemed the one that requires the least code.
  // See https://github.com/bvaughn/react-devtools-experimental/issues/9
  const { SelectedTreeHighlight } = devtools
  return (
    <div
      className="InnerElementType"
      ref={divRef}
      style={style}
      {...rest}>
      <SelectedTreeHighlight />
      {children}
    </div>
  );
}

function Loading() {
  return <div className="Loading">Loading...</div>;
}
