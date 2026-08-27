import { useRef, useState, useCallback } from 'react'

// Snapshot history over a React state value (used by the Konva prototype,
// where the object list is plain data).
export function useHistoryState(initial) {
  const [state, setState] = useState(initial)
  const past = useRef([])
  const future = useRef([])
  const stateRef = useRef(state)
  stateRef.current = state

  const commit = useCallback((next) => {
    past.current.push(stateRef.current)
    future.current = []
    setState(next)
  }, [])

  const undo = useCallback(() => {
    if (!past.current.length) return
    future.current.push(stateRef.current)
    setState(past.current.pop())
  }, [])

  const redo = useCallback(() => {
    if (!future.current.length) return
    past.current.push(stateRef.current)
    setState(future.current.pop())
  }, [])

  const reset = useCallback((next) => {
    past.current = []
    future.current = []
    setState(next)
  }, [])

  return { state, commit, undo, redo, reset, setState }
}

// Serialized-JSON history (used by the Fabric prototype, where canvas.toJSON
// is the natural snapshot).
export class JsonHistory {
  constructor() {
    this.stack = []
    this.idx = -1
  }
  push(json) {
    this.stack.length = this.idx + 1
    this.stack.push(json)
    this.idx++
  }
  undo() {
    if (this.idx <= 0) return null
    this.idx--
    return this.stack[this.idx]
  }
  redo() {
    if (this.idx >= this.stack.length - 1) return null
    this.idx++
    return this.stack[this.idx]
  }
  get canUndo() { return this.idx > 0 }
  get canRedo() { return this.idx < this.stack.length - 1 }
}
