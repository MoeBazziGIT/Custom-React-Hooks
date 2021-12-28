import { useState, useEffect, useRef, useCallback } from 'react';


/* ------- LIFECYLCLE METHOD HOOKS ------- */


// shorthand for the component did mount effect
export function useComponentDidMount(componentDidMountHandler){

  // calling useEffect with an empty dependancy array only gets called when component mounts
  useEffect(() => {
    const onComponentWillUnMountHander = componentDidMountHandler();
    return onComponentWillUnMountHander;
  }, []);

}


// shorthand for the component will unmount effect
export function useComponentWillUnMount(componentWillUnMountHandler){

  useEffect(() => {

    // component will unmount
    return componentWillUnMountHandler;
  }, []);

}

// component will mount
export function useComponentWillMount(componentWillMountHandler){
    const hasRendered = useRef(false);

    // component will mount before first render
    if(!hasRendered.current)
      componentWillMountHandler && componentWillMountHandler();

    hasRendered.current = true;
}


// short hand for setting up componentDidMount, componentWillUnMount, componentWillMountHandler hooks with useEffect
export function useComponentMountLifecycleMethods(componentDidMountHandler, componentWillUnMountHandler, componentWillMountHandler){

  // component did mount
  useEffect(() => {

    componentDidMountHandler && componentDidMountHandler();

    // component will unmount
    if(componentWillUnMountHandler)
      return componentWillUnMountHandler;

  }, []);


  useComponentWillMount(componentWillMountHandler);

}


// component did update effect. runs on subsequent renders
export function useComponentDidUpdate(componentDidUpdateHandler){

  // whether this is the first or a subsequent render
  const isSubsequentRender = useRef(false);

  useEffect(() => {
    if(isSubsequentRender.current)
      componentDidUpdateHandler && componentDidUpdateHandler();
    else
      isSubsequentRender.current = true;
  });

}


// short hand for setting up componentDidMount, componentWillUnMount, componentWillMount and componentDidUpdate hooks with useEffect
export function useComponentLifecycleMethods(componentDidMountHandler, componentWillUnMountHandler, componentWillMountHandler, componentDidUpdateHandler){

  // component did mount, component will unmount and component will mount
  useComponentMountLifecycleMethods(componentDidMountHandler, componentWillUnMountHandler, componentWillMountHandler);

  // component did update
  useComponentDidUpdate(componentDidUpdateHandler);

}


// force re render this component
function useForceUpdate(){
    const [value, setValue] = useState(0);
    return () => setValue(value => (value + 1) % 32); // update the state to force render. max value is 31 -> [0, 31]
}


/* ------- STATE, PROPS AND VALUES ------- */


// get value from previous update to that value
export function usePrevious(value) {

  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;

}


// useState combined with usePrevious.
export function usePrevState(value){

  const [state, setState] = useState(value);
  const prevState = usePrevious(state);

  return [prevState, state, setState];

}


// calls the handler only when the values have been updated (not via the intial render)
export function useValuesUpdated(handler, values){

  // whether this is the first or a subsequent render
  const isSubsequentRender = useRef(false);

  useEffect(() => {
    if(isSubsequentRender.current)
      handler();
    else
      isSubsequentRender.current = true;
  }, values);

}


// calls the handler with the previous value's 'value' when the value has been updated
// if no withValue is is provided, then prevValue wil default to value
export function useValueUpdatedWithPrevious(valueDidUpdateHandler, value, withValue){

  const prevValue = usePrevious(withValue || value);

  useValuesUpdated(() => valueDidUpdateHandler(prevValue), [value]);

}


// for using a state object, similar to the way setState works in class components.
// Note* this is technicaly not *merging* the state values like the setState of class components does. We really
//  are just *replacing* the old state object with the new one.
export function useMergeState(initialState) {

  const [state, setState] = useState(initialState);

  const setMergedState = newState =>
    setState(prevState => Object.assign({}, prevState, newState)
  );

  return [state, setMergedState];
}


/* ------- MISC ------- */

export const useLocalStorage = (key, initialValue) => {
  const item = window.localStorage.getItem(key);
  const [value, setValue] = useState(item || initialValue);

  useEffect(() => {
    window.localStorage.setItem(key, value);
  }, [value, key]);

  return [value, setValue];
};


export const useMedia = () => {
  const [isMobile, setMobile] = useState(false);

  const onResize = () => {
    const isMobile = window.innerWidth < 768;
    setMobile(isMobile);
  };

  useLayoutEffect(() => {
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return { isMobile };
};


export const useScroll = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  const onScroll = () => {
    const scrollTop = window !== undefined ? window.pageYOffset : 0;

    setIsScrolled(scrollTop > 0);
  };

  useEffect(() => {
    // Learn more about how { passive: true } improves scrolling performance
    // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Improving_scrolling_performance_with_passive_listeners
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll, { passive: true });
    };
  }, []);

  return { isScrolled };
};


export const useScrollFreeze = (isMenuOpen) => {
  useLayoutEffect(() => {
    const original = window.getComputedStyle(document.body).overflow;

    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = original;
    };
  }, [isMenuOpen]);
};


export const useTheme = () => {
  const [theme, setTheme] = useLocalStorage("theme", "dark");

  const toggleTheme = () =>
    setTheme((prevTheme) => (prevTheme === "dark" ? "light" : "dark"));

  useEffect(() => {
    document.body.className = "";
    document.body.classList.add(theme);
  }, [theme]);

  return [theme, toggleTheme];
};


export const useToggle = (initialState) => {
  const [isToggled, setToggle] = useState(initialState);
  const toggle = () => setToggle((prevState) => !prevState);
  // return [isToggled, toggle];
  return { isToggled, setToggle, toggle };
};


// provides mouse/touch events with customization such as dragging, double click, hold etc.
export function useMouseEvents(eventCallbacks, targets, config){

  const {
    onSingleClickCallback,
    onDoubleClickCallback,
    onMouseHoldCallback,
    onMouseHoldEndCallback,
    onDragCallback,
    onDragStartCallback,
    onDragEndCallback,
    onDragHoldCallback,
    onDragHoldEndCallback,
    onMouseDownCallback,
    onMouseUpCallback
  } = eventCallbacks;

  // the maximum duration after a single click that qualifies a second click as a double click event
  const doubleClickDuration = (config && config.doubleClickDuration) || 250; // default to 250

  // the minimum duration that mouse must be held down in order to trigger a mouse down (ie hold) event
  const mouseHoldDuration = (config && config.mouseHoldDuration) || 750; // default to 750

  // the minimum duration that mouse must be held down in same position while dragging in order to trigger a drag hold event
  const dragHoldDuration = (config && config.dragHoldDuration) || 750; // default to 750

  // wether or not a drag event is to be prevented after a hold event has occured
  const preventDragIfHeld = (config && config.preventDragIfHeld) || false; // default to false

  // if the mouse down position does not equal the mouse up position, then that does not qualify for a mouse click
  // This will help differentiate between a drag end and click event
  const preventClickIfPosChange =
    (config && config.preventClickIfPosChange) ||
    (onDragEndCallback && true); // default to true if the on drag end callback is handled

  const [state, setState] = useState({
    mouseDown: {
      isDown: false,
      nativeEvent: null,
      time: null,
    },
    mouseHold: {
      isHeld: false,
      nativeEvent: null,
    },
    mouseDrag: {
      isDragged: false,
      nativeEvent: null,
      dragX: null,
      dragY: null
    },
    mouseDragHold: {
      isDragHeld: false,
      nativeEvent: null,
    },
    click: {
      count: 0,
      time: null
    }
  });

  /* refs to event handlers in order to remove the same event listener through different renders */
  const onMouseMoveRef = useRef(onMouseMove);
  const onMouseUpRef = useRef(onMouseUp);
  const onMouseLeaveRef = useRef(onMouseLeave);

  const doubleClickTimoutRef = useRef(null);
  const mouseHoldTimeoutRef = useRef(null);
  const dragHoldTimeoutRef = useRef(null);

  // the event names depending on wether they are mouse or touch events ie. mousemove for mouse and touchmove for touch
  const eventTypes = useRef(null);

  // wether or not to listen to the native move events.
  //  If any of the drag events are registered then it is self explanatory to listen to move events.
  const listenForMoveEvents = onDragStartCallback || onDragCallback || onDragEndCallback || onDragHoldCallback || onDragHoldEndCallback;


  /* SIDE EFFECT HANDLERS */


  useEffect(() => {

    if(targets){
      if(!Array.isArray(targets))
        targets = [targets];

      targets.forEach(target => {
        addEventListeners(target);
      });
    }
    else{
      console.error("useMouseEvents requires a dom target value as the second argument");
    }
  });


  // isDown updated
  useValueUpdatedWithPrevious(
    prevMouseDown => {

      const { isDown, nativeEvent, time } = state.mouseDown; // if isDown, then event is a mousedown event object, otherwise it is a mouseup event object
      if(isDown){ // mouse down event
        // console.log("MOUSE DOWN");
        onMouseDownCallback && onMouseDownCallback(nativeEvent);

        listenForMoveEvents && document.addEventListener(eventTypes.current.move, onMouseMoveRef.current);
        document.addEventListener(eventTypes.current.up, onMouseUpRef.current);

        if(onMouseHoldCallback){
          nativeEvent.target.addEventListener("mouseleave", onMouseLeaveRef.current);
          mouseHoldTimeoutRef.current = setTimeout(() => {
            nativeEvent.target.removeEventListener("mouseleave", onMouseLeaveRef.current);
            setState(prevState => ({ ...prevState, mouseHold: { isHeld: true, nativeEvent } }));
          }, mouseHoldDuration);
        }
      }
      else{ // mouse up event
        // console.log("MOUSE UP");
        onMouseUpCallback && onMouseUpCallback(nativeEvent);

        // did the mouse come up on the same target that the mouse went down on
        const clickedSameTarget = prevMouseDown.nativeEvent.target === nativeEvent.target;

        // if mouse is held or dragged, then dont register a click event
        const isClicked = !state.mouseHold.isHeld && !state.mouseDrag.isDragged && clickedSameTarget;

        setState(prevState => ({
          ...prevState,

          // if any of these events were active, they must be disabled now
          mouseHold: { isHeld: false, nativeEvent },
          mouseDrag: { isDragged: false, nativeEvent, dragX: null, dragY: null },
          mouseDragHold: { isDragHeld: false, nativeEvent },

          click: { count: prevState.click.count + isClicked, nativeEvent, time },
        }));

        document.removeEventListener(eventTypes.current.move, onMouseMoveRef.current);
        document.removeEventListener(eventTypes.current.up, onMouseUpRef.current);
      }
    },
    state.mouseDown.isDown,
    state.mouseDown
  );


  // click count update, ie. mouse has been clicked
  useValueUpdatedWithPrevious(
    prevClick => {
      const { count, nativeEvent, time } = state.click;

      // cancel the potential mouse hold event
      if(count > 0)
        clearTimeout(mouseHoldTimeoutRef.current);

      switch (count){
        case 1:
          if(onDoubleClickCallback){ // if there is no double click callback provided, then no need to settimout to wait
            doubleClickTimoutRef.current = setTimeout(() => {
              // console.log("SINGLE");
              onSingleClickCallback && onSingleClickCallback(nativeEvent);
              setState(prevState => ({ ...prevState, click: { count: 0, time: null, nativeEvent: null } }));
            }, doubleClickDuration)
          }
          else{
            // console.log("SINGLE");
            onSingleClickCallback && onSingleClickCallback(nativeEvent);
            setState(prevState => ({ ...prevState, click: { count: 0, time: null, nativeEvent: null } }));
          }
          break;
        case 2:
          if(time - prevClick.time <= doubleClickDuration){
            clearTimeout(doubleClickTimoutRef.current);
            // console.log("DOUBLE");
            onDoubleClickCallback && onDoubleClickCallback(nativeEvent);
            setState(prevState => ({ ...prevState, click: { count: 0, time: null, nativeEvent: null } }));
          }
          break;
        default:
          break;
      }

    },
    state.click.count,
    state.click
  );


  // is held update
  useValuesUpdated(() => {

    const { isHeld, nativeEvent } = state.mouseHold;

    if(isHeld){
      // console.log("MOUSE HOLD");
      onMouseHoldCallback && onMouseHoldCallback(nativeEvent);
      if(preventDragIfHeld) // dont listen to move events anymore, so that drag events dont get triggered
        document.removeEventListener(eventTypes.current.move, onMouseMoveRef.current);
    }
    else{
      // console.log("MOUSE HOLD END");
      onMouseHoldEndCallback && onMouseHoldEndCallback(nativeEvent);
    }
  }, [state.mouseHold.isHeld]);


  // isDragged updated
  useValuesUpdated(() => {

    const { isDragged, nativeEvent } = state.mouseDrag;
    if(isDragged){
      // cancel the potential mouse hold event
      clearTimeout(mouseHoldTimeoutRef.current);
      // console.log("DRAG START");
      onDragStartCallback && onDragStartCallback(nativeEvent);
    }
    else{
      // console.log("DRAG END");
      onDragEndCallback && onDragEndCallback(nativeEvent);
    }

  }, [state.mouseDrag.isDragged]);


  // drag positions updated ie. mouse is being dragged
  useValuesUpdated(() => {

    const { dragX, dragY, nativeEvent } = state.mouseDrag;

    // reset drag hold
    clearTimeout(dragHoldTimeoutRef.current);
    setState(prevState => ({ ...prevState, mouseDragHold: { isDragHeld: false, nativeEvent } }));

    if(dragX || dragY){
      onDragCallback && onDragCallback(nativeEvent);

      // set new timout. if mouse does not move until dragHoldDuration, then a drag hold event will be triggered
      dragHoldTimeoutRef.current = setTimeout(() => {
        setState(prevState => ({ ...prevState, mouseDragHold: { isDragHeld: true, nativeEvent } }));
      }, dragHoldDuration);
    }

  }, [state.mouseDrag.dragX, state.mouseDrag.dragY]);


  // mouse drag hold updated
  useValuesUpdated(() => {

    const { isDragHeld, nativeEvent } = state.mouseDragHold;

    if(isDragHeld)
      onDragHoldCallback && onDragHoldCallback(nativeEvent);
    else
      onDragHoldEndCallback && onDragHoldEndCallback(nativeEvent);

  }, [state.mouseDragHold.isDragHeld])


  /* NATIVE EVENT HANDLERS */


  function onMouseDown(event){
    // prevent default for onDragstart since this custom hook is handling the implementation of drag events
    event.target.ondragstart = event => {
      event.preventDefault();
    };

    switch (event.type) {
      case "mousedown":
        eventTypes.current = {
          move: "mousemove",
          up: "mouseup"
        }; // need to listen to mouse events
        break;
      case "touchstart":
        eventTypes.current = {
          move: "touchmove",
          up: "touchend"
        }; // need to listen to touch events

        /* "the browser may fire both touch events and mouse events in response to the same user input...if an application does not
           want mouse events fired on a specific touch target element, the element's touch event handlers should call preventDefault()
           and no additional mouse events will be dispatched"
           - https://developer.mozilla.org/en-US/docs/Web/API/Touch_events/Supporting_both_TouchEvent_and_MouseEvent#event_firing
        */ event.preventDefault();

        if(event.touches.length > 1)
          return

        mergeTouchEventProperties(event);
        break;
    }

    setState(prevState => ({ ...prevState, mouseDown: { isDown: true, nativeEvent: event, time: new Date() } }));
  }


  function onMouseUp(event){
    event.preventDefault();
    eventTypes.current.up === "touchend" && mergeTouchEventProperties(event);

    setState(prevState => ({ ...prevState, mouseDown: { isDown: false, nativeEvent: event, time: new Date() } }));
  }


  function onMouseMove(event){
    event.preventDefault();
    eventTypes.current.move === "touchmove" && mergeTouchEventProperties(event);

    setState(prevState => ({ ...prevState, mouseDrag: { isDragged: true, nativeEvent: event, dragX: event.clientX, dragY: event.clientY } }));
  }


  function onMouseLeave(event){

    // if a mouse leaves the target of the on mouse down event, then cancel hold timeout
    clearTimeout(mouseHoldTimeoutRef.current);
    event.target.removeEventListener("mouseleave", onMouseLeaveRef.current);

  }


  /* HELPER/MISC */


  // add the 'down' event handler to the target
  function addEventListeners(target){

    if(typeof target === "string"){ // this is a string of the id of the target element
      target = document.getElementById(target);
    }
    else{ // target is react ref
      target = target.current;
    }

    if(target){
      target.onmousedown = onMouseDown;
      target.ontouchstart = onMouseDown;
    }
    // else{
    //   console.warn("useMouseEvents: Could not find target to attach event listeners. Please make sure that the target is a React ref or an id string of the target element");
    // }

  }


  // attach the properties of the touch event to the greater event object. This is so that mouse and touch event objects have
  //  similar properties such as clientX, pageX, screenX etc.
  function mergeTouchEventProperties(eventToMerge){

    const touch = eventToMerge.changedTouches[0];

    eventToMerge.clientX = touch.clientX;
    eventToMerge.clientY = touch.clientY;

    eventToMerge.pageX = touch.pageX;
    eventToMerge.pageY = touch.pageY;

    eventToMerge.screenX = touch.screenX;
    eventToMerge.screenY = touch.screenY;

  }


  return { isDragged: state.mouseDrag.isDragged, isHeld: state.mouseHold.isHeld, isDragHeld: state.mouseDragHold.isDragHeld };

}


/* ------- EXPERIMENTAL ------- */


// prevents new function closures from using stale state values
export function useNonStaleState(initState){

  const [state, setState] = useState(initState);
  const stateRef = useRef(initState);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  return [stateRef.current, setState];

}


// source: https://dev.to/adelchms96/react-hook-for-waiting-state-update-useasyncstate-147g
export function useAsyncState(initialState) {
  const [state, setState] = useState(initialState);
  const resolveState = useRef();
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (resolveState.current) {
      resolveState.current(state);
    }
  }, [state]);

  const setAsyncState = useCallback(
    newState =>
      new Promise(resolve => {
        if (isMounted.current) {
          resolveState.current = resolve;
          setState(newState);
        }
      }),
    []
  );

  return [state, setAsyncState];
}


// useState, however when the dependency value changes, reset state value to default state
export function useDependentState(dependencyValue, defaultState){

  var [value, setValue] = useState(defaultState);

  var prevDep = usePrevious(dependencyValue);
  if(prevDep !== dependencyValue){
    value = defaultState;
  }

  return [value, setValue];

}



// unmounts and remounts component on update of dependancies
//  Leave out dependencies parameter in order to unmount/mount on every render of parent component of component

// make sure to perform proper clean ups in component before unmounting:
//    -> return a callback method in useEffect(() => return cleanUpMethod, []) ie. componentWillUnmount

// UPDATE: this works but is really unefficnet and unecessary. Causes two additional unecessary renders of parent component.
//  Just use the key property in component to let react handle unmounting and remounting of components
export function useAutoUmountingComponent(newComponent, dependancies){

  var [component, setComponent] = useState(-1);

  useEffect(() => {

    setComponent(null);

  }, dependancies);


  useEffect(() => {

    if(component === null){
      setComponent(newComponent);
    }

  }, [component])

  return component;

}


/* ------- DEPRECATED ------- */


// old version of useMouseEvents, rewrote it because look how god awful this code is.
export function __DEPRECATED__useMouseEvents({ onSingleClickCallback, onDoubleClickCallback, onMouseHoldCallback, onMouseHoldEndCallback, onDragCallback, onDragStartCallback, onDragEndCallback, onDragHoldCallback, onDragHoldEndCallback, options }) {

  // the maximum duration after a single click that qualifies a second click as a double click event
  const doubleClickDuration = (options && options.doubleClickDuration) || 300; // default to 300

  // the minimum duration that mouse must be held down in order to trigger a mouse down (ie hold) event
  const mouseHoldDuration = (options && options.mouseHoldDuration) || 750; // default to 750

  // the minimum duration that mouse must be held down in same position while dragging in order to trigger a drag hold event
  const dragHoldDuration = (options && options.dragHoldDuration) || 750; // default to 750

  // wether or not a drag event is to be prevented after a hold event has occured
  const preventDragIfHeld = (options && options.preventDragIfHeld) || false; // default to false

  // allow trigger a drag event if a held event has occurred
  const onlyDragIfHeld = (options && options.onlyDragIfHeld) || false; // default to false // TODO: implement this

  // if the mouse down position does not equal the mouse up position, then that does not qualify for a mouse click
  // This will help differentiate between a drag end and click event
  const preventClickIfPosChange =
    (options && options.preventClickIfPosChange) ||
    (onDragEndCallback && true); // default to true if the on drag end callback is handled

  // state
  const [state, setState] = useState({
    isMouseDown: false,
    mouseDownPos: null, // the (x,y) position of where the mouse was 'downed'
    clickCount: 0,
    mouseUpEvent: null, // the mouseup event that triggered a click count increment (used to pass the event to the single and double click event handlers)
  });

  // refs to event listeners. we must contain the
  //  same refs to the listeners so that we can properly remove the listeners when needed
  const onMouseMoveRef = useRef(null);
  const onMouseUpRef = useRef(null);
  const doubleClickTimerRef = useRef(null);
  const mouseHoldTimerRef = useRef(null);
  const dragHoldTimerRef = useRef(null);

  const mouseDownTime = useRef(null);
  const isDragged = useRef(false);
  const isDragHeld = useRef(false);

  // refs to the user provided callbacks, in order to keep their function closures up to date
  const onSingleClickCallbackRef = useRef(null);
  onSingleClickCallbackRef.current = onSingleClickCallback;
  const onDoubleClickCallbackRef = useRef(null);
  onDoubleClickCallbackRef.current = onDoubleClickCallback;
  const onMouseHoldCallbackRef = useRef(null);
  onMouseHoldCallbackRef.current = onMouseHoldCallback;
  const onMouseHoldEndCallbackRef = useRef(null);
  onMouseHoldEndCallbackRef.current = onMouseHoldEndCallback;
  const onDragCallbackRef = useRef(null);
  onDragCallbackRef.current = onDragCallback;
  const onDragStartCallbackRef = useRef(null);
  onDragStartCallbackRef.current = onDragStartCallback;
  const onDragEndCallbackRef = useRef(null);
  onDragEndCallbackRef.current = onDragEndCallback;
  const onDragHoldCallbackRef = useRef(null);
  onDragHoldCallbackRef.current = onDragHoldCallback;
  const onDragHoldEndCallbackRef = useRef(null);
  onDragHoldEndCallbackRef.current = onDragHoldEndCallback;

  useEffect(() => {
    if(state.isMouseDown){ // on mouse down
      onMouseUpRef.current = onMouseUp; // update closure
      document.addEventListener('mouseup', onMouseUpRef.current);

      onMouseMoveRef.current = onMouseMove; // update closure
      document.addEventListener('mousemove', onMouseMoveRef.current);
    }
    else{ // on mouse up
      document.removeEventListener('mouseup', onMouseUpRef.current);
      document.removeEventListener('mousemove', onMouseMoveRef.current);
    }

  }, [state.isMouseDown]);


  useEffect(() => {

    // update closure of mousemove listener since it relies on 'click' state
    document.removeEventListener('mousemove', onMouseMoveRef.current);

    // only wait for the double click of a double click event is wanted, otherwise just trigger a single click event directly
    if(onDoubleClickCallbackRef.current){
      doubleClickTimerRef.current = setTimeout(() => {
          // single click event
          if (state.clickCount === 1){
            document.removeEventListener('mousemove', onMouseMoveRef.current);
            onSingleClickCallbackRef.current && onSingleClickCallbackRef.current(state.mouseUpEvent);
          }
          updateClickCount(0);
      }, doubleClickDuration);
    }
    else if(state.clickCount === 1){ // single click event
      onSingleClickCallbackRef.current && onSingleClickCallbackRef.current(state.mouseUpEvent);
      updateClickCount(0);
    }

    // the duration between this click and the previous one
    //  is less than the value of doubleClickDuration which qualifies for a double click event
    if (state.clickCount === 2){
      updateClickCount(0);
      onDoubleClickCallbackRef.current && onDoubleClickCallbackRef.current(state.mouseUpEvent);
    }

    return () => clearTimeout(doubleClickTimerRef.current);

  }, [state.clickCount]);


  function onMouseDown(event){
    // prevent default for onDragstart since this custom hook is handling the implementation of drag events
    event.target.ondragstart = event => {
      event.preventDefault();
    };

    mouseDownTime.current = Date.now();
    mouseHoldTimerRef.current = setTimeout(() => {
      // trigger mouse down (ie hold) event
      onMouseHoldCallbackRef.current && onMouseHoldCallbackRef.current(event);
    }, mouseHoldDuration);

    setState(prevState => {
      return { ...prevState, isMouseDown: true, mouseDownPos: { x: event.pageX, y: event.pageY } };
    });

  }


  // decides wether this onMouseUp event is for a click, end drag, or end hold event
  function onMouseUp(event){
    event.preventDefault();

    let mouseUpTime = Date.now();
    if((mouseUpTime - mouseDownTime.current >= mouseHoldDuration) && mouseHoldTimerRef.current){ // this means that the onMouseDown (ie. hold) event just finished
      onMouseHoldEndCallbackRef.current && onMouseHoldEndCallbackRef.current(event);
      setState(prevState => ({ ...prevState, isMouseDown: false }));
      return;
    }
    else{
      // cancel timer for onMouseDown (ie. hold) event
      clearTimeout(mouseHoldTimerRef.current);
      mouseHoldTimerRef.current = null;
    }

    if(isDragged.current){
      isDragged.current = false;
      onDragEndCallbackRef.current && onDragEndCallbackRef.current(event);
    }

    if(isDragHeld.current){
      isDragHeld.current = false;
      onDragHoldEndCallbackRef.current && onDragHoldEndCallbackRef.current(event);
    }

    // cancel timer for onDragHold event
    clearTimeout(dragHoldTimerRef.current);

    setState(prevState => {

      // if options.preventClickIfPosChange flag is set, then we must check if the position of the
      //  mouse has changed. This will differentiate between a drag end and click event
      let isClicked = true;
      if(preventClickIfPosChange)
        isClicked = event.pageX === state.mouseDownPos.x && event.pageY === state.mouseDownPos.y;

      let mouseUpEvent = null;
      if(isClicked)
        mouseUpEvent = event;

      return {
        ...prevState,
        isMouseDown: false,
        clickCount: prevState.clickCount + isClicked,
        mouseUpEvent
      };
    });

  }


  function onMouseMove(event){

    if(state.isMouseDown){

      const mouseMoveTime = Date.now();
      // wether or not the onMouseDown (ie. hold) is currently taking place
      const isHeld = (mouseMoveTime - mouseDownTime.current >= mouseHoldDuration) && mouseHoldTimerRef.current;

      // cancel timer for onMouseDown (ie. hold) event
      clearTimeout(mouseHoldTimerRef.current);
      mouseHoldTimerRef.current = null;

      if(onDragHoldCallbackRef.current){
        if(isDragHeld.current){
          isDragHeld.current = false;
          onDragHoldEndCallbackRef.current && onDragHoldEndCallbackRef.current(event);
        }
        // cancel timer for onDragHold event
        clearTimeout(dragHoldTimerRef.current);

        // set new timer
        dragHoldTimerRef.current = setTimeout(function dragHoldTimeout(){
          onDragHoldCallbackRef.current(event);
          isDragHeld.current = true;
        }, dragHoldDuration);
      }

      if(!isDragged.current){
        isDragged.current = true;
        onDragStartCallbackRef.current && onDragStartCallbackRef.current(event);
      }

      // trigger drag callback
      onDragCallbackRef.current && onDragCallbackRef.current(event);
    }

  }


  function updateClickCount(clickCount){
    setState(prevState => {
      return { ...prevState, clickCount};
    });
  }

  return onMouseDown;
}

export function useDebounce(value, delay) {
  // State and setters for debounced value
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(
    () => {
      // Update debounced value after delay
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      // Cancel the timeout if value changes (also on delay change or unmount)
      // This is how we prevent debounced value from updating if value is changed ...
      // .. within the delay period. Timeout gets cleared and restarted.
      return () => {
        clearTimeout(handler);
      };
    },
    [value, delay], // Only re-call effect if value or delay changes
  );

  return debouncedValue;
}


export function useHover() {
  const [value, setValue] = useState(false);

  const handleMouseOver = useCallback(() => setValue(true), []);
  const handleMouseOut = useCallback(() => setValue(false), []);

  const ref = useRef();

  const callbackRef = useCallback(
    (node) => {
      if (ref.current) {
        ref.current.removeEventListener('mouseenter', handleMouseOver);
        ref.current.removeEventListener('mouseleave', handleMouseOut);
      }

      ref.current = node;

      if (ref.current) {
        ref.current.addEventListener('mouseenter', handleMouseOver);
        ref.current.addEventListener('mouseleave', handleMouseOut);
      }
    },
    [handleMouseOver, handleMouseOut],
  );

  return [callbackRef, value];
}


export function useIsCameraAvailable() {
  const [cameraAvailable, setCameraAvailable] = useState(false);

  useEffect(() => {
    async function checkCamera() {
      try {
        const res = await navigator.mediaDevices.getUserMedia({video: true});
        setCameraAvailable(res);
      } catch (e) {}
    }

    checkCamera();
  }, []);

  return cameraAvailable;
}


export function useLocalStorage2(key, initialValue) {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState(() => {
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.log(error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = (value) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      // Save state
      setStoredValue(valueToStore);
      // Save to local storage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.log(error);
    }
  };

  return [storedValue, setValue];
}


export function useRightClick(callback) {
  const [elem, setElem] = useState(null);
  const inputCallbackRef = useRef(null);
  const callbackRef = useCallback((node) => {
    setElem(node);
    callbackRef.current = node;
  }, []);

  useEffect(() => {
    inputCallbackRef.current = callback;
  });

  useEffect(() => {
    if (!elem) return;
    elem.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      inputCallbackRef.current(event);
    });
  }, [elem]);
  return [callbackRef, elem];
}


export function useWindowSize() {
  const isClient = typeof window === 'object';

  function getSize() {
    return {
      width: isClient ? window.innerWidth : undefined,
      height: isClient ? window.innerHeight : undefined,
    };
  }

  const [windowSize, setWindowSize] = useState(getSize);

  useEffect(() => {
    if (!isClient) {
      return false;
    }

    function handleResize() {
      setWindowSize(getSize());
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty array ensures that effect is only run on mount and unmount

  return windowSize;
}


function useFileDialog(onSelectFile, options){

  const defaultOptions = {
    accept: '*',
  	multiple: true,
  };

	function openFileDialog(){

		const input = document.createElement('input');
		input.type = 'file';
		input.multiple = options.multiple || true; // default is true
		input.accept = options.accept || "*"; // default is all file types

		input.addEventListener("change", event => {
			const { files } = event.target;
			onSelectFile(files);
		});

		input.click();
	};

	return { openFileDialog };
};

const { openFileDialog } = useFileDialog()
