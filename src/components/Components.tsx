import * as React from 'react';
import {
  Fragment,
  Suspense,
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
} from 'react';

//@ts-ignore
import devtools from "@iteria-app/react-devtools-inline/dist"
import Tree from "./Tree"
import './Components.css';

//console.log('v komponentoch', devtools)
type Orientation = 'horizontal' | 'vertical';

type ResizeActionType =
  | 'ACTION_SET_DID_MOUNT'
  | 'ACTION_SET_IS_RESIZING'
  | 'ACTION_SET_HORIZONTAL_PERCENTAGE'
  | 'ACTION_SET_VERTICAL_PERCENTAGE';

type ResizeAction = {
  type: ResizeActionType,
  payload: any,
};

type ResizeState = {
  horizontalPercentage: number,
  isResizing: boolean,
  verticalPercentage: number,
};

function Components(_: {}) {
  const wrapperElementRef = useRef<null | HTMLDivElement>(null);
  const resizeElementRef = useRef<null | HTMLDivElement>(null);

  const [state, dispatch] = useReducer(
    resizeReducer,
    null,
    initResizeState,
  );

  const { horizontalPercentage, verticalPercentage } = state;

  useLayoutEffect(() => {
    const resizeElement = resizeElementRef.current;

    setResizeCSSVariable(
      resizeElement,
      'horizontal',
      horizontalPercentage * 100,
    );
    setResizeCSSVariable(resizeElement, 'vertical', verticalPercentage * 100);
  }, []);

  useEffect(() => {
    const timeoutID = setTimeout(() => {
      localStorageSetItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          horizontalPercentage,
          verticalPercentage,
        }),
      );
    }, 500);

    return () => clearTimeout(timeoutID);
  }, [horizontalPercentage, verticalPercentage]);

  const { isResizing } = state;

  const onResizeStart = () =>
    dispatch({ type: 'ACTION_SET_IS_RESIZING', payload: true });

  let onResize;
  let onResizeEnd;
  if (isResizing) {
    onResizeEnd = () =>
      dispatch({ type: 'ACTION_SET_IS_RESIZING', payload: false });

    onResize = (event: any) => {
      const resizeElement = resizeElementRef.current;
      const wrapperElement = wrapperElementRef.current;

      if (!isResizing || wrapperElement === null || resizeElement === null) {
        return;
      }

      event.preventDefault();

      const orientation = getOrientation(wrapperElement);

      const { height, width, left, top } = wrapperElement.getBoundingClientRect();

      const currentMousePosition =
        orientation === 'horizontal'
          ? event.clientX - left
          : event.clientY - top;

      const boundaryMin = MINIMUM_SIZE;
      const boundaryMax =
        orientation === 'horizontal'
          ? width - MINIMUM_SIZE
          : height - MINIMUM_SIZE;

      const isMousePositionInBounds =
        currentMousePosition > boundaryMin &&
        currentMousePosition < boundaryMax;

      if (isMousePositionInBounds) {
        const resizedElementDimension =
          orientation === 'horizontal' ? width : height;
        const actionType =
          orientation === 'horizontal'
            ? 'ACTION_SET_HORIZONTAL_PERCENTAGE'
            : 'ACTION_SET_VERTICAL_PERCENTAGE';
        const percentage =
          (currentMousePosition / resizedElementDimension) * 100;

        setResizeCSSVariable(resizeElement, orientation, percentage);

        dispatch({
          type: actionType,
          payload: currentMousePosition / resizedElementDimension,
        });
      }
    };
  }


  const { InspectedElement, InspectedElementContextController, OwnersListContextController, SettingsModalContextController, localStorageSetItem, ModalDialog, SettingsModal, NativeStyleContextController } = devtools

  return (
    <SettingsModalContextController>
      <OwnersListContextController>
        <InspectedElementContextController>
          <div
            ref={wrapperElementRef}
            className="Components"
            onMouseMove={onResize}
            onMouseLeave={onResizeEnd}
            onMouseUp={onResizeEnd}>
            <Fragment>
              <div ref={resizeElementRef} className="TreeWrapper">
                <Tree />
              </div>
              <div className="ResizeBarWrapper">
                <div onMouseDown={onResizeStart} className="ResizeBar" />
              </div>
              <div className="InspectedElementWrapper">
                <NativeStyleContextController>
                  <Suspense fallback={<Loading />}>
                    <InspectedElement />
                  </Suspense>
                </NativeStyleContextController>
              </div>
              <ModalDialog />
              <SettingsModal />
            </Fragment>
          </div>
        </InspectedElementContextController>
      </OwnersListContextController>
    </SettingsModalContextController>
  );
}

function Loading() {
  return <div className="Loading">Loading...</div>;
}

const LOCAL_STORAGE_KEY = 'React::DevTools::createResizeReducer';
const VERTICAL_MODE_MAX_WIDTH = 600;
const MINIMUM_SIZE = 50;

function initResizeState(): ResizeState {
  let horizontalPercentage = 0.65;
  let verticalPercentage = 0.5;
  const { localStorageGetItem } = devtools

  try {
    let data = localStorageGetItem(LOCAL_STORAGE_KEY);
    if (data != null) {
      data = JSON.parse(data);
      horizontalPercentage = data.horizontalPercentage;
      verticalPercentage = data.verticalPercentage;
    }
  } catch (error) { }

  return {
    horizontalPercentage,
    isResizing: false,
    verticalPercentage,
  };
}

function resizeReducer(state: ResizeState, action: ResizeAction): ResizeState {
  switch (action.type) {
    case 'ACTION_SET_IS_RESIZING':
      return {
        ...state,
        isResizing: action.payload,
      };
    case 'ACTION_SET_HORIZONTAL_PERCENTAGE':
      return {
        ...state,
        horizontalPercentage: action.payload,
      };
    case 'ACTION_SET_VERTICAL_PERCENTAGE':
      return {
        ...state,
        verticalPercentage: action.payload,
      };
    default:
      return state;
  }
}

function getOrientation(
  wrapperElement: null | HTMLElement,
): null | Orientation {
  if (wrapperElement != null) {
    const { width } = wrapperElement.getBoundingClientRect();
    return width > VERTICAL_MODE_MAX_WIDTH ? 'horizontal' : 'vertical';
  }
  return null;
}

function setResizeCSSVariable(
  resizeElement: null | HTMLElement,
  orientation: null | Orientation,
  percentage: number,
): void {
  if (resizeElement !== null && orientation !== null) {
    resizeElement.style.setProperty(
      `--${orientation}-resize-percentage`,
      `${percentage}%`,
    );
  }
}

const { portaledContent } = devtools
export default portaledContent(Components);
