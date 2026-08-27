import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Stage, Layer, Rect, Text, Image as KImage, Transformer } from 'react-konva'
import TShirtViewer from '../garment-lab/TShirtViewer.jsx'
import { SURFACE_SIZE, newElement } from '../engine/model.js'
import { VINYL_SRC } from '../shared/builtin.js'
import { useHistoryState } from '../shared/history.js'
import { attachPinch } from '../shared/pinch.js'

const CANVAS = SURFACE_SIZE

function useHtmlImage(src) {
  const [img, setImg] = useState(null)
  useEffect(() => {
    if (!src) return
    const i = new window.Image()
    i.onload = () => setImg(i)
    i.src = src
  }, [src])
  return img
}

function SceneImage({ obj, src, common }) {
  const img = useHtmlImage(src)
  return <KImage image={img} width={obj.width} height={obj.height} {...common} />
}

// The Visual Lab canvas, operating directly on the engine's Element model.
// `elements` is the front surface's layer stack; every committed change goes
// back through onCommit so the project engine owns the truth.
export default forwardRef(function CanvasEditor({
  elements: initialElements,
  resetKey,
  assets,
  onCommit,
  onSelectionChange,
  onThumbnail,
  sidePanels,
}, ref) {
  const { state: objects, commit: commitState, undo, redo, reset } = useHistoryState(initialElements)
  const [selectedId, setSelectedId] = useState(null)
  const [scale, setScale] = useState(1)

  const stageRef = useRef(null)
  const contentLayerRef = useRef(null)
  const trRef = useRef(null)
  const wrapRef = useRef(null)
  const versionRef = useRef(0)
  const justSelectedRef = useRef(false)

  const objectsRef = useRef(objects)
  objectsRef.current = objects
  const selectedIdRef = useRef(selectedId)
  selectedIdRef.current = selectedId

  const selected = objects.find((o) => o.id === selectedId) || null

  // External state change (design switch, version restore) resets the editor.
  useEffect(() => {
    reset(initialElements)
    setSelectedId(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey])

  useEffect(() => {
    onSelectionChange?.(selected)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, objects])

  const commit = (next) => {
    commitState(next)
    onCommit?.(next)
    requestAnimationFrame(() => {
      const layer = contentLayerRef.current
      if (layer && onThumbnail) {
        try {
          onThumbnail(layer.toDataURL({ pixelRatio: 200 / (CANVAS.w * (scaleRef.current || 1)) }))
        } catch { /* thumbnail is best-effort */ }
      }
    })
  }

  const scaleRef = useRef(scale)
  scaleRef.current = scale

  // History operations also need to reach the engine.
  const undoAll = () => { undo(); queueMicrotask(() => onCommit?.(objectsRef.current)) }
  const redoAll = () => { redo(); queueMicrotask(() => onCommit?.(objectsRef.current)) }

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const fit = () => setScale(Math.min(1, el.clientWidth / CANVAS.w))
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const layer = contentLayerRef.current
    if (!layer) return
    const bump = () => { versionRef.current++ }
    layer.on('draw', bump)
    return () => layer.off('draw', bump)
  }, [])

  useEffect(() => {
    const tr = trRef.current
    const stage = stageRef.current
    if (!tr || !stage) return
    const node = selected && !selected.locked ? stage.findOne('#' + selected.id) : null
    tr.nodes(node ? [node] : [])
    tr.getLayer().batchDraw()
  }, [selected, objects])

  const patchObject = (id, patch) =>
    commit(objectsRef.current.map((o) => (o.id === id ? { ...o, ...patch } : o)))

  const commitNodeAttrs = (id, node) =>
    patchObject(id, {
      x: node.x(), y: node.y(),
      scaleX: node.scaleX(), scaleY: node.scaleY(),
      rotation: node.rotation(),
    })

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    return attachPinch(el, {
      start: () => {
        const id = selectedIdRef.current
        if (!id) return null
        const obj = objectsRef.current.find((o) => o.id === id)
        if (!obj || obj.locked) return null
        const node = stageRef.current?.findOne('#' + id)
        if (!node) return null
        node.stopDrag()
        return { id, node, scaleX: node.scaleX(), scaleY: node.scaleY(), rotation: node.rotation() }
      },
      move: (base, k, deg) => {
        base.node.scaleX(base.scaleX * k)
        base.node.scaleY(base.scaleY * k)
        base.node.rotation(base.rotation + deg)
        base.node.getLayer().batchDraw()
      },
      end: (base) => commitNodeAttrs(base.id, base.node),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Panels (provenance, classification, source placement) reach elements
  // through this handle so their changes join the same undo history.
  useImperativeHandle(ref, () => ({
    patchElement: (id, patch) => patchObject(id, patch),
    addExternalElement: (el) => {
      commit([...objectsRef.current, el])
      setSelectedId(el.id)
    },
  }))

  const objectIndex = (id) => objectsRef.current.findIndex((o) => o.id === id)

  const handlePointerDown = (e) => {
    const stage = stageRef.current
    if (e.target === stage) {
      setSelectedId(null)
      return
    }
    const id = e.target.id()
    if (id && id !== selectedIdRef.current) {
      setSelectedId(id)
      justSelectedRef.current = true
    }
  }

  const handleTap = (e) => {
    if (justSelectedRef.current) {
      justSelectedRef.current = false
      return
    }
    const stage = stageRef.current
    const id = e.target.id?.()
    if (!id || id !== selectedIdRef.current) return
    const pos = stage.getPointerPosition()
    const hits = stage
      .getAllIntersections(pos)
      .map((n) => n.id())
      .filter((hid) => hid && objectIndex(hid) >= 0)
    if (hits.length < 2) return
    hits.sort((a, b) => objectIndex(b) - objectIndex(a))
    const cur = hits.indexOf(id)
    setSelectedId(hits[(cur + 1) % hits.length])
  }

  const addElement = (kind) => {
    let el
    if (kind === 'text') {
      el = newElement({
        kind: 'text', name: 'Text', x: 200, y: 200, text: 'DUB', fontSize: 64,
        fill: '#e8e4da', lineHeight: 1.02,
        fontFamily: '"Arial Narrow", "Helvetica Neue", Arial, sans-serif',
      })
    } else if (kind === 'image') {
      el = newElement({ kind: 'image', name: 'Image', x: 220, y: 220, width: 200, height: 200, src: VINYL_SRC })
    } else if (kind === 'frame') {
      el = newElement({ kind: 'frame', name: 'Frame', x: 160, y: 160, width: 320, height: 320, stroke: '#c8452c', strokeWidth: 2 })
    } else {
      el = newElement({ kind: 'rect', name: 'Bar', x: 180, y: 300, width: 280, height: 30, fill: '#3d7a3a' })
    }
    commit([...objectsRef.current, el])
    setSelectedId(el.id)
  }

  const duplicate = () => {
    if (!selected) return
    const copy = {
      ...structuredClone(selected),
      id: newElement({ kind: selected.kind }).id,
      name: selected.name + ' copy',
      x: selected.x + 18, y: selected.y + 18, locked: false,
    }
    commit([...objectsRef.current, copy])
    setSelectedId(copy.id)
  }

  const remove = () => {
    if (!selected) return
    commit(objectsRef.current.filter((o) => o.id !== selected.id))
    setSelectedId(null)
  }

  const move = (dir) => {
    if (!selected) return
    const arr = [...objectsRef.current]
    const i = arr.findIndex((o) => o.id === selected.id)
    const j = i + dir
    if (j < 0 || j >= arr.length) return
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
    commit(arr)
  }

  const toggleLock = () => {
    if (!selected) return
    patchObject(selected.id, { locked: !selected.locked })
  }

  const commonProps = (o) => ({
    id: o.id,
    x: o.x, y: o.y,
    rotation: o.rotation,
    scaleX: o.scaleX, scaleY: o.scaleY,
    draggable: !o.locked,
    onDragEnd: (e) => commitNodeAttrs(o.id, e.target),
    onTransformEnd: (e) => commitNodeAttrs(o.id, e.target),
  })

  const getSourceCanvas = () => contentLayerRef.current?.getCanvas()._canvas || null

  return (
    <div className="editor-page">
      <div className="editor-main">
        <div className="canvas-wrap" ref={wrapRef}>
          <Stage
            ref={stageRef}
            width={CANVAS.w * scale}
            height={CANVAS.h * scale}
            scaleX={scale}
            scaleY={scale}
            onMouseDown={handlePointerDown}
            onTouchStart={handlePointerDown}
            onClick={handleTap}
            onTap={handleTap}
          >
            <Layer ref={contentLayerRef}>
              {objects.map((o) => {
                const common = commonProps(o)
                if (o.kind === 'rect')
                  return <Rect key={o.id} width={o.width} height={o.height} fill={o.fill} {...common} />
                if (o.kind === 'frame')
                  return (
                    <Rect key={o.id} width={o.width} height={o.height} stroke={o.stroke}
                      strokeWidth={o.strokeWidth} fillEnabled={false} hitStrokeWidth={24} {...common} />
                  )
                if (o.kind === 'text')
                  return (
                    <Text key={o.id} text={o.text} fontSize={o.fontSize} fontFamily={o.fontFamily}
                      fontStyle="bold" fill={o.fill} lineHeight={o.lineHeight} {...common} />
                  )
                if (o.kind === 'image')
                  return (
                    <SceneImage key={o.id} obj={o}
                      src={o.assetId ? assets?.[o.assetId] : o.src} common={common} />
                  )
                return null
              })}
            </Layer>
            <Layer>
              <Transformer ref={trRef} rotateEnabled keepRatio={false} />
            </Layer>
          </Stage>
        </div>

        <div className="toolbar">
          <span className="group-label">ADD</span>
          <button onClick={() => addElement('text')}>Text</button>
          <button onClick={() => addElement('image')}>Image</button>
          <button onClick={() => addElement('rect')}>Bar</button>
          <button onClick={() => addElement('frame')}>Frame</button>
          <span className="group-label">OBJECT</span>
          <button onClick={duplicate} disabled={!selected}>Duplicate</button>
          <button onClick={remove} disabled={!selected}>Delete</button>
          <button onClick={() => move(+1)} disabled={!selected}>Forward</button>
          <button onClick={() => move(-1)} disabled={!selected}>Backward</button>
          <button onClick={toggleLock} disabled={!selected}>
            {selected?.locked ? 'Unlock' : 'Lock'}
          </button>
          <span className="group-label">EDIT</span>
          <button onClick={undoAll}>Undo</button>
          <button onClick={redoAll}>Redo</button>
        </div>

        <div className="statusline">
          {selected
            ? `${selected.name} — ${selected.locked ? 'LOCKED' : 'tap again to select beneath · drag to move · two fingers to scale/rotate'}`
            : 'Tap an object to select. Two fingers on a selected object: pinch to scale, twist to rotate.'}
        </div>
      </div>

      <div className="side-col">
        <TShirtViewer getSourceCanvas={getSourceCanvas} versionRef={versionRef} label="LIVE" />
        {sidePanels}
      </div>
    </div>
  )
})
