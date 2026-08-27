import React, { useEffect, useRef, useState } from 'react'
import { Canvas, Rect, IText, FabricImage } from 'fabric'
import TShirtViewer from '../three/TShirtViewer.jsx'
import { CANVAS, seedObjects, makeObject, nextId } from '../shared/seed.js'
import { JsonHistory } from '../shared/history.js'
import { attachPinch } from '../shared/pinch.js'

const STORAGE_KEY = 'rfml-spike01-fabric'
const EXTRA_PROPS = [
  'id', 'name', 'locked', 'kind', 'selectable', 'hasControls', 'perPixelTargetFind',
  'lockMovementX', 'lockMovementY', 'lockScalingX', 'lockScalingY', 'lockRotation',
]

function applyLock(obj, locked) {
  obj.set({
    locked,
    lockMovementX: locked,
    lockMovementY: locked,
    lockScalingX: locked,
    lockScalingY: locked,
    lockRotation: locked,
    hasControls: !locked,
  })
}

async function buildFabricObject(o) {
  let obj
  if (o.kind === 'image') {
    obj = await FabricImage.fromURL(o.src)
    obj.set({
      left: o.x, top: o.y, angle: o.rotation,
      scaleX: (o.width / obj.width) * o.scaleX,
      scaleY: (o.height / obj.height) * o.scaleY,
    })
  } else if (o.kind === 'text') {
    obj = new IText(o.text, {
      left: o.x, top: o.y, angle: o.rotation,
      fontSize: o.fontSize, fill: o.fill, fontFamily: o.fontFamily,
      fontWeight: 'bold', lineHeight: o.lineHeight,
      scaleX: o.scaleX, scaleY: o.scaleY,
    })
  } else if (o.kind === 'frame') {
    obj = new Rect({
      left: o.x, top: o.y, width: o.width, height: o.height, angle: o.rotation,
      fill: '', stroke: o.stroke, strokeWidth: o.strokeWidth,
      perPixelTargetFind: true,
      scaleX: o.scaleX, scaleY: o.scaleY,
    })
  } else {
    obj = new Rect({
      left: o.x, top: o.y, width: o.width, height: o.height, angle: o.rotation,
      fill: o.fill, scaleX: o.scaleX, scaleY: o.scaleY,
    })
  }
  obj.set({ id: o.id, name: o.name, kind: o.kind })
  applyLock(obj, !!o.locked)
  return obj
}

export default function FabricEditor() {
  const canvasElRef = useRef(null)
  const wrapRef = useRef(null)
  const fcRef = useRef(null)
  const historyRef = useRef(new JsonHistory())
  const versionRef = useRef(0)
  const downInfoRef = useRef(null)
  const [selected, setSelected] = useState(null) // {id, name, locked}

  const snapshot = () => JSON.stringify(fcRef.current.toObject(EXTRA_PROPS))
  const pushHistory = () => historyRef.current.push(snapshot())

  const refreshSelected = () => {
    const obj = fcRef.current?.getActiveObject()
    setSelected(obj ? { id: obj.id, name: obj.name || obj.kind, locked: !!obj.locked } : null)
  }

  useEffect(() => {
    const fc = new Canvas(canvasElRef.current, {
      width: CANVAS.w,
      height: CANVAS.h,
      preserveObjectStacking: true,
      selection: false,
      targetFindTolerance: 12,
    })
    fcRef.current = fc

    fc.on('after:render', () => { versionRef.current++ })
    fc.on('object:modified', () => { pushHistory() })
    fc.on('selection:created', refreshSelected)
    fc.on('selection:updated', refreshSelected)
    fc.on('selection:cleared', refreshSelected)

    // Tap the already-selected object again (without dragging) to select the
    // object beneath it.
    fc.on('mouse:down', (opt) => {
      const p = opt.viewportPoint || { x: 0, y: 0 }
      downInfoRef.current = {
        x: p.x, y: p.y,
        wasActive: !!opt.target && opt.target === fc.getActiveObject(),
        target: opt.target || null,
      }
    })
    fc.on('mouse:up', (opt) => {
      const info = downInfoRef.current
      downInfoRef.current = null
      if (!info || !info.wasActive || !info.target) return
      const p = opt.viewportPoint || { x: 0, y: 0 }
      if (Math.hypot(p.x - info.x, p.y - info.y) > 6) return
      const scene = fc.getScenePoint(opt.e)
      const hits = fc.getObjects().filter((o) => o.containsPoint(scene)).reverse() // topmost first
      if (hits.length < 2) return
      const cur = hits.indexOf(info.target)
      if (cur === -1) return
      const next = hits[(cur + 1) % hits.length]
      fc.setActiveObject(next)
      fc.requestRenderAll()
    })

    // Seed the identical starting composition.
    ;(async () => {
      for (const o of seedObjects()) fc.add(await buildFabricObject(o))
      fc.requestRenderAll()
      pushHistory()
    })()

    // Responsive fit.
    const el = wrapRef.current
    const fit = () => {
      const s = Math.min(1, el.clientWidth / CANVAS.w)
      fc.setDimensions({ width: CANVAS.w * s, height: CANVAS.h * s })
      fc.setZoom(s)
      fc.requestRenderAll()
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)

    // Two-finger pinch/twist on the selected object.
    const detachPinch = attachPinch(el, {
      start: () => {
        const obj = fc.getActiveObject()
        if (!obj || obj.locked) return null
        return { obj, sx: obj.scaleX, sy: obj.scaleY, angle: obj.angle }
      },
      move: (base, k, deg) => {
        base.obj.set({ scaleX: base.sx * k, scaleY: base.sy * k, angle: base.angle + deg })
        base.obj.setCoords()
        fc.requestRenderAll()
      },
      end: () => pushHistory(),
    })

    return () => {
      ro.disconnect()
      detachPinch()
      fc.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const withActive = (fn) => {
    const fc = fcRef.current
    const obj = fc?.getActiveObject()
    if (obj) fn(fc, obj)
  }

  const restore = async (json) => {
    const fc = fcRef.current
    if (!json) return
    await fc.loadFromJSON(json)
    fc.discardActiveObject()
    fc.requestRenderAll()
    setSelected(null)
  }

  const addObject = async (kind) => {
    const fc = fcRef.current
    const obj = await buildFabricObject(makeObject(kind))
    fc.add(obj)
    fc.setActiveObject(obj)
    fc.requestRenderAll()
    pushHistory()
  }

  const duplicate = () =>
    withActive(async (fc, obj) => {
      const copy = await obj.clone(EXTRA_PROPS)
      copy.set({ left: obj.left + 18, top: obj.top + 18, id: nextId('copy'), name: (obj.name || obj.kind) + ' copy' })
      applyLock(copy, false)
      fc.add(copy)
      fc.setActiveObject(copy)
      fc.requestRenderAll()
      pushHistory()
    })

  const remove = () =>
    withActive((fc, obj) => {
      fc.remove(obj)
      fc.discardActiveObject()
      fc.requestRenderAll()
      pushHistory()
    })

  const forward = () =>
    withActive((fc, obj) => {
      fc.bringObjectForward(obj)
      fc.requestRenderAll()
      pushHistory()
    })

  const backward = () =>
    withActive((fc, obj) => {
      fc.sendObjectBackwards(obj)
      fc.requestRenderAll()
      pushHistory()
    })

  const toggleLock = () =>
    withActive((fc, obj) => {
      applyLock(obj, !obj.locked)
      fc.requestRenderAll()
      refreshSelected()
      pushHistory()
    })

  const undo = () => restore(historyRef.current.undo())
  const redo = () => restore(historyRef.current.redo())

  const save = () => localStorage.setItem(STORAGE_KEY, snapshot())
  const load = async () => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      await restore(raw)
      pushHistory()
    }
  }

  const resetScene = async () => {
    const fc = fcRef.current
    fc.remove(...fc.getObjects())
    for (const o of seedObjects()) fc.add(await buildFabricObject(o))
    fc.discardActiveObject()
    fc.requestRenderAll()
    setSelected(null)
    pushHistory()
  }

  // Fabric renders the active object's controls into the content canvas, so a
  // zero-copy lowerCanvasEl capture would print selection handles onto the
  // shirt. toCanvasElement() re-renders content-only — an extra per-frame
  // render during drags, a real comparison point against Konva's layer canvas.
  const getSourceCanvas = () => {
    const fc = fcRef.current
    if (!fc || !fc.lowerCanvasEl) return null
    try {
      return fc.toCanvasElement(1024 / fc.getWidth())
    } catch {
      return null
    }
  }

  return (
    <div className="editor-page">
      <div className="editor-main">
        <div className="canvas-wrap" ref={wrapRef}>
          <canvas ref={canvasElRef} />
        </div>

        <div className="toolbar">
          <span className="group-label">ADD</span>
          <button onClick={() => addObject('text')}>Text</button>
          <button onClick={() => addObject('image')}>Image</button>
          <button onClick={() => addObject('rect')}>Bar</button>
          <button onClick={() => addObject('frame')}>Frame</button>
          <span className="group-label">OBJECT</span>
          <button onClick={duplicate} disabled={!selected}>Duplicate</button>
          <button onClick={remove} disabled={!selected}>Delete</button>
          <button onClick={forward} disabled={!selected}>Forward</button>
          <button onClick={backward} disabled={!selected}>Backward</button>
          <button onClick={toggleLock} disabled={!selected}>
            {selected?.locked ? 'Unlock' : 'Lock'}
          </button>
          <span className="group-label">PROJECT</span>
          <button onClick={undo}>Undo</button>
          <button onClick={redo}>Redo</button>
          <button onClick={save}>Save</button>
          <button onClick={load}>Load</button>
          <button onClick={resetScene}>Reset</button>
        </div>

        <div className="statusline">
          {selected
            ? `${selected.name} — ${selected.locked ? 'LOCKED' : 'tap again to select beneath · drag to move · two fingers to scale/rotate · double-tap text to edit'}`
            : 'Tap an object to select. Two fingers on a selected object: pinch to scale, twist to rotate.'}
        </div>
      </div>

      <TShirtViewer getSourceCanvas={getSourceCanvas} versionRef={versionRef} label="FABRIC" />
    </div>
  )
}
