import { useState, useEffect, useRef } from 'react';

// get value from previous update to that value
export function usePrevious(value) {

  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;

}


// useState combined with use previous.
export function usePrevState(value){

  const [state, setState] = useState(value);
  const prevState = usePrevious(state);

  return [prevState, state, setState];

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


// short hand for setting up componentDidMount and componentWillUnMount hooks with useEffect
export function useMountCallBacks(componentDidMountCallBack, componentWillUnMountCallBack){

  // component did mount
  useEffect(() => {

    componentDidMountCallBack();

    // component will unmount
    return () => {
      componentWillUnMountCallBack();
    }

  }, []);

}


// short hand for setting up componentDidMount, componentWillUnMount and componentDidUpdate hooks with useEffect
export function useComponentLifecycleMethods(componentDidMountHandler, componentWillUnMountHandler, componentDidUpdateHandler){

  // component did mount
  useEffect(() => {

    componentDidMountHandler();

    // component will unmount
    return () => {
      componentWillUnMountHandler();
    }

  }, []);

  // component did update
  useComponentDidUpdate(componentDidUpdateHandler);

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


// runs on subsequent renders
export function useComponentDidUpdate(handler){

  // whether this is the first or a subsequent render
  const isSubsequentRender = useRef(false);

  useEffect(() => {
    if(isSubsequentRender.current)
      handler();
    else
      isSubsequentRender.current = true;
  });

}


// calls the handler only when the dependancies have been updated (not via the intial render)
export function useDependancyUpdated(handler, dependencies){

  // whether this is the first or a subsequent render
  const isSubsequentRender = useRef(false);

  useEffect(() => {
    if(isSubsequentRender.current)
      handler();
    else
      isSubsequentRender.current = true;
  }, dependancies);

}
