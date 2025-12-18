import { useState, useCallback, useEffect } from 'react';

interface UseUndoRedoOptions {
  maxHistory?: number;
}

interface UseUndoRedoReturn<T> {
  state: T;
  setState: (newState: T | ((prev: T) => T)) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clearHistory: () => void;
}

export function useUndoRedo<T>(
  initialState: T,
  options: UseUndoRedoOptions = {}
): UseUndoRedoReturn<T> {
  const { maxHistory = 50 } = options;
  
  const [state, setStateInternal] = useState<T>(initialState);
  const [past, setPast] = useState<T[]>([]);
  const [future, setFuture] = useState<T[]>([]);

  // Sync with external state changes (e.g., from localStorage)
  useEffect(() => {
    if (JSON.stringify(state) !== JSON.stringify(initialState)) {
      setStateInternal(initialState);
    }
  }, [initialState]);

  const setState = useCallback((newState: T | ((prev: T) => T)) => {
    setStateInternal((currentState) => {
      const resolvedState = typeof newState === 'function' 
        ? (newState as (prev: T) => T)(currentState)
        : newState;
      
      // Only push to history if state actually changed
      if (JSON.stringify(resolvedState) !== JSON.stringify(currentState)) {
        setPast((prevPast) => {
          const newPast = [...prevPast, currentState];
          // Limit history size
          if (newPast.length > maxHistory) {
            return newPast.slice(-maxHistory);
          }
          return newPast;
        });
        // Clear future when new action is taken
        setFuture([]);
      }
      
      return resolvedState;
    });
  }, [maxHistory]);

  const undo = useCallback(() => {
    setPast((prevPast) => {
      if (prevPast.length === 0) return prevPast;
      
      const newPast = [...prevPast];
      const previousState = newPast.pop()!;
      
      setStateInternal((currentState) => {
        setFuture((prevFuture) => [currentState, ...prevFuture]);
        return previousState;
      });
      
      return newPast;
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((prevFuture) => {
      if (prevFuture.length === 0) return prevFuture;
      
      const newFuture = [...prevFuture];
      const nextState = newFuture.shift()!;
      
      setStateInternal((currentState) => {
        setPast((prevPast) => [...prevPast, currentState]);
        return nextState;
      });
      
      return newFuture;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setPast([]);
    setFuture([]);
  }, []);

  return {
    state,
    setState,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    clearHistory,
  };
}
