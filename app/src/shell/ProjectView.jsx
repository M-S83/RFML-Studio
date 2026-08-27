import React, { useEffect, useRef, useState } from 'react'
import CanvasEditor from '../visual-lab/CanvasEditor.jsx'
import { VersionsPanel, SourcesPanel, ElementPanel, LayersPanel, PropertiesPanel } from './panels.jsx'
import {
  loadProject, saveProject, addDesign, duplicateDesign,
  snapshotVersion, restoreVersion, addSource, putAsset, getAssetMap,
} from '../engine/store.js'
import { newElement } from '../engine/model.js'

const fmtTime = (iso) => iso?.replace('T', ' ').slice(0, 19) || ''

function collectAssetIds(project) {
  const ids = []
  for (const s of project.sources) if (s.assetId) ids.push(s.assetId)
  for (const d of project.designs)
    for (const surf of Object.values(d.surfaces))
      for (const el of surf.elements) if (el.assetId) ids.push(el.assetId)
  return ids
}

export default function ProjectView({ projectId, designId }) {
  const [project, setProject] = useState(null)
  const [assets, setAssets] = useState({})
  const [savedAt, setSavedAt] = useState(null)
  const [resetCounter, setResetCounter] = useState(0)
  const [selectedElement, setSelectedElement] = useState(null)
  const [missing, setMissing] = useState(false)
  const editorRef = useRef(null)
  const saveTimer = useRef(null)
  const projectRef = useRef(null)
  projectRef.current = project

  useEffect(() => {
    let alive = true
    loadProject(projectId).then(async (p) => {
      if (!alive) return
      if (!p) { setMissing(true); return }
      setProject(p)
      setAssets(await getAssetMap(collectAssetIds(p)))
    })
    return () => { alive = false }
  }, [projectId])

  // Autosave: every mutation schedules a debounced write; the design can be
  // closed at any point and reopened exactly where it was left.
  const scheduleSave = () => {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const p = projectRef.current
      if (!p) return
      await saveProject(p)
      setSavedAt(new Date().toISOString())
    }, 600)
  }
  useEffect(() => () => clearTimeout(saveTimer.current), [])

  const mutate = (fn) => {
    setProject((p) => {
      const next = { ...p }
      fn(next)
      return next
    })
    scheduleSave()
  }

  const design = project?.designs.find((d) => d.id === designId) || null

  // Debug/verification hook (used by the automated exit-condition test).
  useEffect(() => {
    window.__rfml = {
      projectId,
      designId,
      savedAt,
      elements: () =>
        design
          ? design.surfaces.front.elements.map((e) => ({
              id: e.id, name: e.name, kind: e.kind,
              x: Math.round(e.x), y: Math.round(e.y),
              rotation: Math.round(e.rotation), scaleX: +e.scaleX.toFixed(3),
              classification: e.classification, sourceIds: [...e.sourceIds],
              locked: e.locked, visible: e.visible !== false,
              opacity: e.opacity ?? 1, blend: e.blend ?? null, mask: e.mask ?? null,
              cropped: !!e.crop, text: e.text,
              letterSpacing: e.letterSpacing ?? 0, fontFamily: e.fontFamily,
              children: e.kind === 'group' ? e.children.length : undefined,
            }))
          : null,
      versions: () => design?.versions.map((v) => v.label) || [],
      sources: () => project?.sources.map((s) => s.name) || [],
    }
  })

  if (missing) return <p className="lede">Project not found. <a href="#/">Back to Workbench</a></p>
  if (!project) return <p className="lede">Loading…</p>

  // ---- Project overview (no design selected) ----
  if (!design) {
    return (
      <div className="home">
        <h2>
          <span className="k" style={{ marginRight: 10 }}>{project.code}</span>
          {project.name}
        </h2>
        <div className="new-work">
          <button
            className="primary"
            onClick={() => {
              let created
              mutate((p) => { created = addDesign(p) })
              setTimeout(() => { window.location.hash = `#/p/${project.id}/d/${created.id}` }, 0)
            }}
          >
            New design
          </button>
        </div>
        <div className="cards">
          {project.designs.map((d) => (
            <div className="card project-card" key={d.id}>
              <a href={`#/p/${project.id}/d/${d.id}`}>
                {d.thumbnail ? (
                  <img className="card-thumb" src={d.thumbnail} alt="" />
                ) : (
                  <div className="card-thumb placeholder" />
                )}
                <strong>{d.name}</strong>
              </a>
              <span className="row-sub">
                {d.versions.length} version{d.versions.length === 1 ? '' : 's'} · {fmtTime(d.updatedAt)}
              </span>
              <div className="card-actions">
                <button onClick={() => mutate((p) => duplicateDesign(p, d.id))}>Duplicate</button>
              </div>
            </div>
          ))}
        </div>
        <div className="statusline">{savedAt ? `SAVED ${fmtTime(savedAt)}` : 'All changes autosave.'}</div>
      </div>
    )
  }

  // ---- Design editor ----

  const touchDesign = () => { design.updatedAt = new Date().toISOString() }

  const onCommit = (elements) =>
    mutate(() => {
      design.surfaces.front.elements = elements
      touchDesign()
    })

  const onThumbnail = (dataUrl) =>
    mutate(() => { design.thumbnail = dataUrl })

  const onSnapshot = () => mutate(() => snapshotVersion(design))

  const onRestore = (versionId) => {
    mutate((p) => restoreVersion(design, versionId))
    setResetCounter((c) => c + 1)
    setSelectedElement(null)
  }

  const onClassify = (elementId, classification) =>
    editorRef.current?.patchElement(elementId, { classification })

  const onLink = (source) => {
    const el = selectedElement
    if (!el) return
    if (el.sourceIds.includes(source.id)) return
    editorRef.current?.patchElement(el.id, {
      sourceIds: [...el.sourceIds, source.id],
      classification: el.classification === 'rfml_created' ? 'rfml_transformed' : el.classification,
    })
  }

  const onPlace = (source) => {
    const el = newElement({
      kind: 'image',
      name: source.name,
      x: 200, y: 200, width: 240, height: 240,
      assetId: source.assetId,
      classification: 'source_material',
      sourceIds: [source.id],
    })
    editorRef.current?.addExternalElement(el)
  }

  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const r = new FileReader()
      r.onload = () => resolve(r.result)
      r.onerror = reject
      r.readAsDataURL(file)
    })

  const imageSize = (dataUrl) =>
    new Promise((resolve) => {
      const i = new window.Image()
      i.onload = () => resolve({ w: i.naturalWidth, h: i.naturalHeight })
      i.onerror = () => resolve({ w: 240, h: 240 })
      i.src = dataUrl
    })

  const onAddSource = async ({ name, rightsStatus, file }) => {
    let assetId = null
    if (file) {
      const dataUrl = await readFileAsDataUrl(file)
      const asset = await putAsset(dataUrl, { name })
      assetId = asset.id
      setAssets((a) => ({ ...a, [assetId]: dataUrl }))
    }
    mutate((p) => addSource(p, { name, rightsStatus, assetId }))
  }

  // Direct image upload from the Visual Lab toolbar: stored once as an asset,
  // placed as an RFML-created element (reclassify from the Provenance panel
  // if it is actually source material).
  const onUploadImage = async (file) => {
    const dataUrl = await readFileAsDataUrl(file)
    const asset = await putAsset(dataUrl, { name: file.name })
    setAssets((a) => ({ ...a, [asset.id]: dataUrl }))
    scheduleSave()
    const { w, h } = await imageSize(dataUrl)
    const fit = Math.min(1, 320 / Math.max(w, h))
    return newElement({
      kind: 'image',
      name: file.name.replace(/\.[a-z0-9]+$/i, ''),
      x: 160, y: 160,
      width: Math.max(40, w * fit), height: Math.max(40, h * fit),
      assetId: asset.id,
    })
  }

  const onToggleVisible = (el) =>
    editorRef.current?.patchElement(el.id, { visible: el.visible === false })

  const onToggleLock = (el) =>
    editorRef.current?.patchElement(el.id, { locked: !el.locked })

  const onSelectLayer = (id) => editorRef.current?.selectElement(id)

  const onPatchElement = (id, patch) => editorRef.current?.patchElement(id, patch)

  const onCropElement = (id) => editorRef.current?.beginCrop(id)

  return (
    <div>
      <div className="breadcrumb">
        <a href={`#/p/${project.id}`}>← {project.code} · {project.name}</a>
        <span className="k">{design.name}</span>
        <span className="save-indicator">{savedAt ? `SAVED ${fmtTime(savedAt).slice(11)}` : 'autosave on'}</span>
      </div>
      <CanvasEditor
        ref={editorRef}
        elements={design.surfaces.front.elements}
        resetKey={`${design.id}:${resetCounter}`}
        assets={assets}
        onCommit={onCommit}
        onSelectionChange={setSelectedElement}
        onThumbnail={onThumbnail}
        onUploadImage={onUploadImage}
        sidePanels={
          <>
            <PropertiesPanel element={selectedElement} onPatch={onPatchElement} onCrop={onCropElement} />
            <LayersPanel
              elements={design.surfaces.front.elements}
              selectedId={selectedElement?.id || null}
              onSelect={onSelectLayer}
              onToggleVisible={onToggleVisible}
              onToggleLock={onToggleLock}
            />
            <VersionsPanel design={design} onSnapshot={onSnapshot} onRestore={onRestore} />
            <ElementPanel element={selectedElement} sources={project.sources} onClassify={onClassify} />
            <SourcesPanel
              sources={project.sources}
              assets={assets}
              selectedElement={selectedElement}
              onAddSource={onAddSource}
              onLink={onLink}
              onPlace={onPlace}
            />
          </>
        }
      />
    </div>
  )
}
