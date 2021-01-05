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
