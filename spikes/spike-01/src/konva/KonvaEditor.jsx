import React, { useEffect, useRef, useState } from 'react'
import { Stage, Layer, Rect, Text, Image as KImage, Transformer } from 'react-konva'
import TShirtViewer from '../three/TShirtViewer.jsx'
import { CANVAS, seedObjects, makeObject, nextId } from '../shared/seed.js'
import { useHistoryState } from '../shared/history.js'
import { attachPinch } from '../shared/pinch.js'

const STORAGE_KEY = 'rfml-spike01-konva'

function useHtmlImage(src) {
  const [img, setImg] = useState(null)
  useEffect(() => {
    const i = new window.Image()
    i.onload = () => setImg(i)
    i.src = src
  }, [src])
  return img
}

function SceneImage({ obj, common }) {
  const img = useHtmlImage(obj.src)
  return <KImage image={img} width={obj.width} height={obj.height} {...common} />
}

export default function KonvaEditor() {
  const { state: objects, commit, undo, redo, reset } = useHistoryState(seedObjects())
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

  // Responsive: fit the 640x640 scene to the container width.
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const fit = () => setScale(Math.min(1, el.clientWidth / CANVAS.w))
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Every content-layer draw (drag frames included) invalidates the 3D texture.
  useEffect(() => {
    const layer = contentLayerRef.current
    if (!layer) return
    const bump = () => { versionRef.current++ }
    layer.on('draw', bump)
    return () => layer.off('draw', bump)
  }, [])

  // Attach the transformer to the selected, unlocked node.
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
      x: node.x(),
      y: node.y(),
      scaleX: node.scaleX(),
      scaleY: node.scaleY(),
      rotation: node.rotation(),
    })

  // Two-finger pinch/twist on the selected object.
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

  // Tap the already-selected object again to select the object beneath it —
  // the "select the object underneath" step of the mobile test.
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
    hits.sort((a, b) => objectIndex(b) - objectIndex(a)) // topmost first
    const cur = hits.indexOf(id)
    const next = hits[(cur + 1) % hits.length]
    setSelectedId(next)
  }

  const addObject = (kind) => {
    const obj = makeObject(kind)
    commit([...objectsRef.current, obj])
    setSelectedId(obj.id)
  }

  const duplicate = () => {
    if (!selected) return
    const copy = { ...selected, id: nextId('copy'), name: selected.name + ' copy', x: selected.x + 18, y: selected.y + 18, locked: false }
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

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(objectsRef.current))
  }

  const load = () => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      commit(JSON.parse(raw))
      setSelectedId(null)
    }
  }

  const resetScene = () => {
    reset(seedObjects())
    setSelectedId(null)
  }

  const commonProps = (o) => ({
    id: o.id,
    x: o.x,
    y: o.y,
    rotation: o.rotation,
    scaleX: o.scaleX,
    scaleY: o.scaleY,
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
                    <Rect
                      key={o.id}
                      width={o.width}
                      height={o.height}
                      stroke={o.stroke}
                      strokeWidth={o.strokeWidth}
                      fillEnabled={false}
                      hitStrokeWidth={24}
                      {...common}
                    />
                  )
                if (o.kind === 'text')
                  return (
                    <Text
                      key={o.id}
                      text={o.text}
                      fontSize={o.fontSize}
                      fontFamily={o.fontFamily}
                      fontStyle="bold"
                      fill={o.fill}
                      lineHeight={o.lineHeight}
                      {...common}
                    />
                  )
                if (o.kind === 'image') return <SceneImage key={o.id} obj={o} common={common} />
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
          <button onClick={() => addObject('text')}>Text</button>
          <button onClick={() => addObject('image')}>Image</button>
          <button onClick={() => addObject('rect')}>Bar</button>
          <button onClick={() => addObject('frame')}>Frame</button>
          <span className="group-label">OBJECT</span>
          <button onClick={duplicate} disabled={!selected}>Duplicate</button>
          <button onClick={remove} disabled={!selected}>Delete</button>
          <button onClick={() => move(+1)} disabled={!selected}>Forward</button>
          <button onClick={() => move(-1)} disabled={!selected}>Backward</button>
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
            ? `${selected.name} — ${selected.locked ? 'LOCKED' : 'tap again to select beneath · drag to move · two fingers to scale/rotate'}`
            : 'Tap an object to select. Two fingers on a selected object: pinch to scale, twist to rotate.'}
        </div>
      </div>

      <TShirtViewer getSourceCanvas={getSourceCanvas} versionRef={versionRef} label="KONVA" />
    </div>
  )
}
