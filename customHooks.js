import { useState, useEffect, useRef } from 'react';

// get value from previous update to that value
export function usePrevious(value) {

  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;

}


// useState, however when the dependancy value changes, reset state in place to default state
export function useDependentState(dependancyValue, defaultState){

  var [value, setValue] = useState(defaultState);

  var prevDep = usePrevious(dependancyValue);
  if(prevDep !== dependancyValue){
    value = defaultState;
  }

  return [value, setValue];

}



// unmounts and remounts component on update of dependancies
//  leave out dependies parameter in order unmount/mount on every render of parent component of component

// make sure to perform proper clean ups in component before unmounting:
//    -> return a callback method in useEffect(() => return cleanUpMethod, []) ie. componentWillUnmount
export function useAutoUmountingComponent(newComponent, dependancies){

  var [component, setComponent] = useState(-1);

  useEffect(() => {

    setComponent(null)

  }, dependancies);


  useEffect(() => {

    if(component === null){
      setComponent(newComponent);
    }

  }, [component])

  return component;

}
