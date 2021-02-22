import { useState, useEffect, useRef, useCallback } from 'react';


/* ------- LIFECYLCLE METHOD HOOKS ------- */


// shorthand for the component did mount effect
export function useComponentDidMount(componentDidMountHandler){

  // calling useEffect with an empty dependancy array only gets called when component mounts
  useEffect(componentDidMountHandler, []);

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
      componentWillMountHandler();

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
      componentDidUpdateHandler();
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

  useValuesUpdated(() => valueDidUpdateHandler(prevValue), [value])

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


// returns a listener for onMouseDown events for elements. Pass in callback functions for multiple mouse events
// TODO: https://github.com/MoeBazziGIT/Custom-React-Hooks/issues/2
export function useMouseEvents({ onSingleClickCallback, onDoubleClickCallback, onMouseHoldCallback, onMouseHoldEndCallback, onDragCallback, onDragStartCallback, onDragEndCallback, options }) {

  // the maximum duration after a single click that qualifies a second click as a double click event
  const doubleClickDuration = (options && options.doubleClickDuration) || 300; // default to 350

  // the minimum duration that mouse must be held down in order to trigger a mouse down (ie hold) event
  const mouseHoldDuration = (options && options.mouseHoldDuration) || 750; // default to 750

  // wether or not a drag event is to be prevented after a hold event has occured
  const preventDragIfHeld = (options && options.preventDragIfHeld) || false; // default to false // TODO: implement this

  // allow trigger a drag event if a held event has occurred
  const onlyDragIfHeld = (options && options.onlyDragIfHeld) || false; // default to false // TODO: implement this

  // if the mosue down position does not equal the mouse up position, then that does not qualify for a mouse click
  // This will differentiate between a drag end and click event
  const preventClickIfPosChange =
    (options && options.preventClickIfPosChange) ||
    (onDragEndCallback && true); // default to true if the on drag end callback is handled

  // state
  const [state, setState] = useState({
    isMouseDown: false,
    mouseDownPos: null, // the (x,y) position of where the mouse was 'downed'
    clickCount: 0,
  });

  // refs to event listeners. we must contain the
  //  same refs to the listeners so that we can properly remove the listeners when needed
  const onMouseMoveRef = useRef(null);
  const onMouseUpRef = useRef(null);
  const doubleClickTimerRef = useRef(null);
  const mouseHoldTimerRef = useRef(null);

  const mouseDownTime = useRef(null);
  const isDragged = useRef(false);

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
    if(onDoubleClickCallback){
      doubleClickTimerRef.current = setTimeout(() => {
          // single click event
          if (state.clickCount === 1){
            document.removeEventListener('mousemove', onMouseMoveRef.current);
            onSingleClickCallback && onSingleClickCallback();
          }
          updateClickCount(0);
      }, doubleClickDuration);
    }
    else{ // single click event
      onSingleClickCallback && onSingleClickCallback();
      updateClickCount(0);
    }

    // the duration between this click and the previous one
    //  is less than the value of doubleClickDuration which qualifies for a double click event
    if (state.clickCount === 2){
      updateClickCount(0);
      onDoubleClickCallback && onDoubleClickCallback();
    }

    return () => clearTimeout(doubleClickTimerRef.current);

  }, [state.clickCount]);


  function onMouseDown(syntheticEvent){
    // prevent default for onDragstart since this custom hook is handling the implementation of drag events
    syntheticEvent.target.ondragstart = event => {
      event.preventDefault();
    };

    mouseDownTime.current = Date.now();
    mouseHoldTimerRef.current = setTimeout(() => {
      // trigger mouse down (ie hold) event
      onMouseHoldCallback && onMouseHoldCallback();
    }, mouseHoldDuration);

    setState(prevState => {
      return { ...prevState, isMouseDown: true, mouseDownPos: { x: syntheticEvent.pageX, y: syntheticEvent.pageY } };
    });

  }


  // decides wether this onMouseUp event is for a click, end drag, or end hold event
  function onMouseUp(event){
    event.preventDefault();

    let mouseUpTime = Date.now();
    if((mouseUpTime - mouseDownTime.current >= mouseHoldDuration) && mouseHoldTimerRef.current){ // this means that the onMouseDown (ie. hold) event just finished
      onMouseHoldEndCallback && onMouseHoldEndCallback();
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
      onDragEndCallback && onDragEndCallback();
    }

    setState(prevState => {

      // if options.preventClickIfPosChange flag is set, then we must check if the position of the
      //  mouse has changed. This will differentiate between a drag end and click event
      let isClicked = true;
      if(preventClickIfPosChange)
        isClicked = event.pageX === state.mouseDownPos.x && event.pageY === state.mouseDownPos.y;

      return {
        ...prevState,
        isMouseDown: false,
        clickCount: prevState.clickCount + isClicked
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

      if(!isDragged.current){
        isDragged.current = true;
        onDragStartCallback && onDragStartCallback(event);
      }

      // trigger drag callback
      onDragCallback && onDragCallback(event);
    }

  }


  function updateClickCount(clickCount){
    setState(prevState => {
      return { ...prevState, clickCount};
    });
  }

  return (syntheticEvent) => onMouseDown(syntheticEvent);
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
