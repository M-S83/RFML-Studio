import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Stage, Layer, Group as KGroup, Rect, Text, Image as KImage, Transformer } from 'react-konva'
import Konva from 'konva'
import { SURFACE_SIZE, newElement, normalizeElement } from '../engine/model.js'
import { VINYL_SRC, grainTexture, halftoneTexture } from '../shared/builtin.js'
import { useHistoryState } from '../shared/history.js'
import { attachPinch } from '../shared/pinch.js'
import { useHtmlImage, maskClipFunc, shadowProps } from './renderElements.jsx'

const CANVAS = SURFACE_SIZE

function SceneImage({ obj, src, common, onNatural }) {
  const img = useHtmlImage(src)
  useEffect(() => {
    if (img && onNatural) onNatural(obj.id, { w: img.naturalWidth, h: img.naturalHeight })
  }, [img]) // eslint-disable-line react-hooks/exhaustive-deps
  const imageProps = {
    image: img,
    width: obj.width,
    height: obj.height,
    crop: obj.crop || undefined,
  }
  if (obj.mask) {
    // Transform lives on the clipping group; the image sits at 0,0 inside it.
    return (
      <KGroup {...common} clipFunc={maskClipFunc(obj)}>
        <KImage {...imageProps} />
      </KGroup>
    )
  }
  return <KImage {...imageProps} {...common} />
}

const elementTransform = (o) => {
  const t = new Konva.Transform()
  t.translate(o.x, o.y)
  t.rotate(((o.rotation || 0) * Math.PI) / 180)
  t.scale(o.scaleX || 1, o.scaleY || 1)
  return t
}

const reId = (el) => {
  const copy = structuredClone(el)
  copy.id = newElement({ kind: el.kind }).id
  if (copy.kind === 'group') copy.children = copy.children.map(reId)
  return copy
}

// The Visual Lab canvas, operating directly on the engine's Element model.
export default forwardRef(function CanvasEditor({
  elements: initialElements,
  resetKey,
  assets,
  onCommit,
  onSelectionChange,
  onThumbnail,
  onUploadImage,
  versionRef: externalVersionRef,
  sidePanels,
}, ref) {
  const { state: objects, commit: commitState, undo, redo, reset } = useHistoryState(
    initialElements.map(normalizeElement)
  )
  const [selectedIds, setSelectedIds] = useState([])
  const [multiMode, setMultiMode] = useState(false)
  const [scale, setScale] = useState(1)
  const [textEdit, setTextEdit] = useState(null) // {id, value}
  const [cropId, setCropId] = useState(null)

  const stageRef = useRef(null)
  const contentLayerRef = useRef(null)
  const trRef = useRef(null)
  const cropTrRef = useRef(null)
  const cropRectRef = useRef(null)
  const wrapRef = useRef(null)
  const fileInputRef = useRef(null)
  const internalVersionRef = useRef(0)
  const versionRef = externalVersionRef || internalVersionRef
  const justSelectedRef = useRef(false)
  const clipboardRef = useRef(null)
  const naturalsRef = useRef({})

  const objectsRef = useRef(objects)
  objectsRef.current = objects
  const selectedIdsRef = useRef(selectedIds)
  selectedIdsRef.current = selectedIds
  const scaleRef = useRef(scale)
  scaleRef.current = scale
  const multiRef = useRef(multiMode)
  multiRef.current = multiMode

  const selected = objects.find((o) => o.id === selectedIds[0]) || null

  useEffect(() => {
    reset(initialElements.map(normalizeElement))
    setSelectedIds([])
    setTextEdit(null)
    setCropId(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey])

  useEffect(() => {
    onSelectionChange?.(selected)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds, objects])

  const commit = (next) => {
    commitState(next)
    onCommit?.(next)
    requestAnimationFrame(() => {
      const layer = contentLayerRef.current
      if (layer && onThumbnail) {
        try {
          onThumbnail(layer.toDataURL({ pixelRatio: 200 / (CANVAS.w * (scaleRef.current || 1)) }))
        } catch { /* best-effort */ }
      }
    })
  }

  const undoAll = () => { setCropId(null); undo(); queueMicrotask(() => onCommit?.(objectsRef.current)) }
  const redoAll = () => { setCropId(null); redo(); queueMicrotask(() => onCommit?.(objectsRef.current)) }

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

  // Transformer follows the (unlocked, visible) selection.
  useEffect(() => {
    const tr = trRef.current
    const stage = stageRef.current
    if (!tr || !stage) return
    const nodes = selectedIds
      .map((id) => {
        const o = objectsRef.current.find((x) => x.id === id)
        return o && !o.locked && o.visible !== false ? stage.findOne('#' + id) : null
      })
      .filter(Boolean)
    tr.nodes(cropId ? [] : nodes)
    tr.getLayer().batchDraw()
  }, [selectedIds, objects, cropId])

  const patchObject = (id, patch) =>
    commit(objectsRef.current.map((o) => (o.id === id ? { ...o, ...patch } : o)))

  const commitNodeAttrs = (id, node) =>
    patchObject(id, {
      x: node.x(), y: node.y(),
      scaleX: node.scaleX(), scaleY: node.scaleY(),
      rotation: node.rotation(),
    })

  useImperativeHandle(ref, () => ({
    patchElement: (id, patch) => patchObject(id, patch),
    addExternalElement: (el) => {
      commit([...objectsRef.current, normalizeElement(el)])
      setSelectedIds([el.id])
    },
    selectElement: (id) => setSelectedIds(id ? [id] : []),
    beginCrop: (id) => beginCrop(id),
    getLiveCanvas: () => contentLayerRef.current?.getCanvas()._canvas || null,
  }))

  // Two-finger pinch/twist on the primary selection.
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    return attachPinch(el, {
      start: () => {
        const id = selectedIdsRef.current[0]
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

  // Children of groups and masked images carry no Konva id; climb to the
  // top-level node that does.
  const resolveTargetId = (node) => {
    let n = node
    while (n && (!n.id?.() || objectIndex(n.id()) < 0)) n = n.getParent?.()
    return n && objectIndex(n.id()) >= 0 ? n.id() : null
  }

  const handlePointerDown = (e) => {
    if (cropId) return
    const stage = stageRef.current
    if (e.target === stage) {
      if (!multiRef.current) setSelectedIds([])
      return
    }
    const id = resolveTargetId(e.target)
    if (!id) return
    const cur = selectedIdsRef.current
    const additive = multiRef.current || e.evt?.shiftKey
    if (additive) {
      if (!cur.includes(id)) {
        setSelectedIds([...cur, id])
        justSelectedRef.current = true
      }
    } else if (cur[0] !== id || cur.length > 1) {
      setSelectedIds([id])
      justSelectedRef.current = true
    }
  }

  // Tap the already-selected object again to select the object beneath it.
  const handleTap = (e) => {
    if (cropId) return
    if (justSelectedRef.current) {
      justSelectedRef.current = false
      return
    }
    if (multiRef.current || e.evt?.shiftKey) return
    const stage = stageRef.current
    const id = resolveTargetId(e.target)
    if (!id || id !== selectedIdsRef.current[0]) return
    const pos = stage.getPointerPosition()
    const hits = [...new Set(
      stage.getAllIntersections(pos).map((n) => resolveTargetId(n)).filter(Boolean)
    )].filter((hid) => {
      const o = objectsRef.current.find((x) => x.id === hid)
      return o && o.visible !== false
    })
    if (hits.length < 2) return
    hits.sort((a, b) => objectIndex(b) - objectIndex(a))
    const cur = hits.indexOf(id)
    setSelectedIds([hits[(cur + 1) % hits.length]])
  }

  // ---- In-place text editing ----
  const handleDblTap = (e) => {
    const id = resolveTargetId(e.target)
    const o = objectsRef.current.find((x) => x.id === id)
    if (o && o.kind === 'text' && !o.locked) setTextEdit({ id: o.id, value: o.text })
  }

  const finishTextEdit = (apply) => {
    if (!textEdit) return
    if (apply) patchObject(textEdit.id, { text: textEdit.value || ' ' })
    setTextEdit(null)
  }

  // ---- Add / duplicate / delete / order / lock ----
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
    } else if (kind === 'grain' || kind === 'halftone') {
      el = newElement({
        kind: 'image', name: kind === 'grain' ? 'Grain texture' : 'Halftone texture',
        x: 0, y: 0, width: CANVAS.w, height: CANVAS.h,
        src: kind === 'grain' ? grainTexture() : halftoneTexture(),
        blend: kind === 'grain' ? 'overlay' : 'multiply', opacity: 0.4,
      })
    } else {
      el = newElement({ kind: 'rect', name: 'Bar', x: 180, y: 300, width: 280, height: 30, fill: '#3d7a3a' })
    }
    commit([...objectsRef.current, el])
    setSelectedIds([el.id])
  }

  const duplicate = () => {
    if (!selected) return
    const copy = reId(selected)
    copy.name = selected.name + ' copy'
    copy.x += 18
    copy.y += 18
    copy.locked = false
    commit([...objectsRef.current, copy])
    setSelectedIds([copy.id])
  }

  const remove = () => {
    const ids = selectedIdsRef.current
    if (!ids.length) return
    commit(objectsRef.current.filter((o) => !ids.includes(o.id)))
    setSelectedIds([])
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

  // ---- Copy / paste ----
  const copySelection = () => {
    const ids = selectedIdsRef.current
    if (!ids.length) return
    clipboardRef.current = objectsRef.current.filter((o) => ids.includes(o.id)).map((o) => structuredClone(o))
  }

  const paste = () => {
    const clip = clipboardRef.current
    if (!clip?.length) return
    const copies = clip.map((o) => {
      const c = reId(o)
      c.x += 18
      c.y += 18
      c.locked = false
      return c
    })
    commit([...objectsRef.current, ...copies])
    setSelectedIds(copies.map((c) => c.id))
  }

  // ---- Grouping ----
  const groupSelection = () => {
    const ids = selectedIdsRef.current
    if (ids.length < 2) return
    const arr = objectsRef.current
    const members = arr.filter((o) => ids.includes(o.id) && !o.locked)
    if (members.length < 2) return
    const rest = arr.filter((o) => !members.some((m) => m.id === o.id))
    const insertAt = Math.max(...members.map((m) => arr.indexOf(m))) - (arr.length - rest.length) + 1
    const group = newElement({ kind: 'group', name: 'Group', x: 0, y: 0, children: members })
    const next = [...rest]
    next.splice(Math.min(Math.max(insertAt, 0), rest.length), 0, group)
    commit(next)
    setSelectedIds([group.id])
    setMultiMode(false)
  }

  const ungroup = () => {
    if (!selected || selected.kind !== 'group') return
    const g = elementTransform(selected)
    const children = selected.children.map((child) => {
      const m = g.copy().multiply(elementTransform(child))
      const d = m.decompose()
      return { ...child, x: d.x, y: d.y, rotation: d.rotation, scaleX: d.scaleX, scaleY: d.scaleY }
    })
    const arr = [...objectsRef.current]
    const i = arr.findIndex((o) => o.id === selected.id)
    arr.splice(i, 1, ...children)
    commit(arr)
    setSelectedIds(children.map((c) => c.id))
  }

  // ---- Crop (image elements) ----
  const beginCrop = (id) => {
    const o = objectsRef.current.find((x) => x.id === (id || selectedIdsRef.current[0]))
    if (!o || o.kind !== 'image' || o.locked || o.mask) return
    setCropId(o.id)
  }

  useEffect(() => {
    if (!cropId) return
    const o = objectsRef.current.find((x) => x.id === cropId)
    const rect = cropRectRef.current
    const tr = cropTrRef.current
    if (!o || !rect || !tr) return
    rect.setAttrs({
      x: o.x, y: o.y, rotation: o.rotation,
      scaleX: 1, scaleY: 1,
      width: o.width * o.scaleX, height: o.height * o.scaleY,
    })
    tr.nodes([rect])
    tr.getLayer().batchDraw()
  }, [cropId]) // eslint-disable-line react-hooks/exhaustive-deps

  const applyCrop = () => {
    const o = objectsRef.current.find((x) => x.id === cropId)
    const rect = cropRectRef.current
    const natural = naturalsRef.current[cropId]
    if (!o || !rect || !natural) { setCropId(null); return }
    // Rect → element-local space (rotations match, so the result is axis-aligned).
    const m = elementTransform(o).copy().invert().multiply(elementTransform({
      x: rect.x(), y: rect.y(), rotation: rect.rotation(),
      scaleX: rect.scaleX(), scaleY: rect.scaleY(),
    }))
    const d = m.decompose()
    const localX = d.x
    const localY = d.y
    const localW = rect.width() * d.scaleX
    const localH = rect.height() * d.scaleY
    const base = o.crop || { x: 0, y: 0, width: natural.w, height: natural.h }
    const pxX = base.width / o.width
    const pxY = base.height / o.height
    const crop = {
      x: Math.max(0, base.x + localX * pxX),
      y: Math.max(0, base.y + localY * pxY),
      width: Math.max(1, localW * pxX),
      height: Math.max(1, localH * pxY),
    }
    // Keep the element's own scale; width/height are in element-local units.
    patchObject(o.id, {
      crop,
      x: rect.x(), y: rect.y(),
      width: localW, height: localH,
    })
    setCropId(null)
  }

  // ---- Image upload ----
  const onFilePicked = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !onUploadImage) return
    const el = await onUploadImage(file)
    if (el) {
      commit([...objectsRef.current, normalizeElement(el)])
      setSelectedIds([el.id])
    }
  }

  // ---- Keyboard shortcuts ----
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undoAll() }
      else if (mod && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redoAll() }
      else if (mod && e.key === 'c') { e.preventDefault(); copySelection() }
      else if (mod && e.key === 'v') { e.preventDefault(); paste() }
      else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); remove() }
      else if (e.key === 'Escape') { setCropId(null); setSelectedIds([]) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const commonProps = (o, draggable = true) => ({
    id: o.id,
    x: o.x, y: o.y,
    rotation: o.rotation,
    scaleX: o.scaleX, scaleY: o.scaleY,
    opacity: o.opacity ?? 1,
    visible: o.visible !== false,
    globalCompositeOperation: o.blend || undefined,
    draggable: draggable && !o.locked && !cropId,
    onDragEnd: (e) => { if (e.target.id() === o.id) commitNodeAttrs(o.id, e.target) },
    onTransformEnd: (e) => { if (e.target.id() === o.id) commitNodeAttrs(o.id, e.target) },
  })

  const renderElement = (o, inGroup = false) => {
    // Children inside a group render without ids/draggable; the group is the
    // interactive unit.
    const common = inGroup
      ? {
          x: o.x, y: o.y, rotation: o.rotation, scaleX: o.scaleX, scaleY: o.scaleY,
          opacity: o.opacity ?? 1, visible: o.visible !== false,
          globalCompositeOperation: o.blend || undefined,
        }
      : commonProps(o)
    if (o.kind === 'group')
      return (
        <KGroup key={o.id} {...common}>
          {o.children.map((c) => renderElement(c, true))}
        </KGroup>
      )
    if (o.kind === 'rect')
      return <Rect key={o.id} width={o.width} height={o.height} fill={o.fill} {...shadowProps(o)} {...common} />
    if (o.kind === 'frame')
      return (
        <Rect key={o.id} width={o.width} height={o.height} stroke={o.stroke}
          strokeWidth={o.strokeWidth} fillEnabled={false} hitStrokeWidth={24} {...common} />
      )
    if (o.kind === 'text')
      return (
        <Text key={o.id} text={o.text} fontSize={o.fontSize} fontFamily={o.fontFamily}
          fontStyle="bold" fill={o.fill} lineHeight={o.lineHeight}
          letterSpacing={o.letterSpacing || 0}
          stroke={o.strokeWidth ? o.stroke : undefined}
          strokeWidth={o.strokeWidth || 0}
          fillAfterStrokeEnabled
          {...shadowProps(o)} {...common} />
      )
    if (o.kind === 'image')
      return (
        <SceneImage key={o.id} obj={o}
          src={o.assetId ? assets?.[o.assetId] : o.src}
          common={common}
          onNatural={(id, n) => { naturalsRef.current[id] = n }} />
      )
    return null
  }

  // Text edit overlay geometry.
  const editNode = textEdit ? stageRef.current?.findOne('#' + textEdit.id) : null
  const editObj = textEdit ? objects.find((o) => o.id === textEdit.id) : null

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
            onDblClick={handleDblTap}
            onDblTap={handleDblTap}
          >
            <Layer ref={contentLayerRef}>
              {objects.map((o) => renderElement(o))}
            </Layer>
            <Layer>
              <Transformer ref={trRef} rotateEnabled keepRatio={false} />
              {cropId && (
                <>
                  <Rect ref={cropRectRef} stroke="#2f6fdc" strokeWidth={1.5} dash={[6, 4]}
                    fillEnabled={false} draggable hitStrokeWidth={24} />
                  <Transformer ref={cropTrRef} rotateEnabled={false} keepRatio={false} />
                </>
              )}
            </Layer>
          </Stage>
          {textEdit && editNode && editObj && (
            <textarea
              className="text-edit-overlay"
              autoFocus
              value={textEdit.value}
              onChange={(e) => setTextEdit({ ...textEdit, value: e.target.value })}
              onBlur={() => finishTextEdit(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); finishTextEdit(true) }
                if (e.key === 'Escape') finishTextEdit(false)
              }}
              style={{
                left: editNode.getAbsolutePosition().x,
                top: editNode.getAbsolutePosition().y,
                width: Math.max(140, editNode.width() * editObj.scaleX * scale + 24),
                fontSize: editObj.fontSize * editObj.scaleY * scale,
                fontFamily: editObj.fontFamily,
                lineHeight: editObj.lineHeight,
                color: editObj.fill,
                transform: `rotate(${editObj.rotation}deg)`,
              }}
            />
          )}
        </div>

        <div className="toolbar">
          <span className="group-label">ADD</span>
          <button onClick={() => addElement('text')}>Text</button>
          <button onClick={() => addElement('image')}>Image</button>
          <button onClick={() => fileInputRef.current?.click()}>Upload</button>
          <button onClick={() => addElement('rect')}>Bar</button>
          <button onClick={() => addElement('frame')}>Frame</button>
          <button onClick={() => addElement('grain')}>Grain</button>
          <button onClick={() => addElement('halftone')}>Halftone</button>
          <span className="group-label">OBJECT</span>
          <button onClick={duplicate} disabled={!selected}>Duplicate</button>
          <button onClick={remove} disabled={!selectedIds.length}>Delete</button>
          <button onClick={() => move(+1)} disabled={!selected}>Forward</button>
          <button onClick={() => move(-1)} disabled={!selected}>Backward</button>
          <button onClick={toggleLock} disabled={!selected}>
            {selected?.locked ? 'Unlock' : 'Lock'}
          </button>
          <span className="group-label">GROUP</span>
          <button
            className={multiMode ? 'active' : ''}
            onClick={() => setMultiMode((m) => !m)}
          >
            Multi{multiMode ? ' ✓' : ''}
          </button>
          <button onClick={groupSelection} disabled={selectedIds.length < 2}>Group</button>
          <button onClick={ungroup} disabled={selected?.kind !== 'group'}>Ungroup</button>
          <span className="group-label">EDIT</span>
          <button onClick={copySelection} disabled={!selectedIds.length}>Copy</button>
          <button onClick={paste}>Paste</button>
          <button onClick={undoAll}>Undo</button>
          <button onClick={redoAll}>Redo</button>
          {cropId ? (
            <>
              <span className="group-label">CROP</span>
              <button className="active" onClick={applyCrop}>Apply crop</button>
              <button onClick={() => setCropId(null)}>Cancel</button>
            </>
          ) : (
            selected?.kind === 'image' && !selected.mask && (
              <>
                <span className="group-label">IMAGE</span>
                <button onClick={() => beginCrop(selected.id)}>Crop</button>
              </>
            )
          )}
        </div>

        <div className="statusline">
          {cropId
            ? 'CROP — move/resize the blue region, then Apply crop.'
            : selected
              ? `${selected.name}${selectedIds.length > 1 ? ` +${selectedIds.length - 1}` : ''} — ${selected.locked ? 'LOCKED' : 'tap again to select beneath · double-tap text to edit · two fingers to scale/rotate'}`
              : 'Tap an object to select. Multi lets you build a selection for grouping.'}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFilePicked} />
      </div>

      <div className="side-col">
        {sidePanels}
      </div>
    </div>
  )
})
