import { useState, useEffect, useRef } from 'react';

// custom hook for getting previous value
export function usePrevious(value) {

  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;

}
