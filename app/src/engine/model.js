// Core Studio objects (Development Plan §7). Every object has a stable id.
//
// Relationships enforced here:
//   Design belongs to Project            (design.projectId)
//   Version belongs to Design            (version.designId)
//   Layer belongs to Version snapshot / working surface (element order IS the
//     layer stack; each Element is one layer entry on one Surface)
//   Source can connect to Design, Element or Extraction (linked by id)
//   Extraction always connects back to Source (constructor throws without one)
//   Element is Source Material, RFML Created or RFML Transformed
//   Production Output connects to an approved Version (constructor enforces)

import { uid } from './ids.js'

export const CLASSIFICATIONS = ['rfml_created', 'source_material', 'rfml_transformed']
export const RIGHTS_STATES = ['unknown', 'research_only', 'cleared', 'rfml_original']

export const GARMENT_TEMPLATES = {
  // 3D garment assets belong to a global template library, not to projects.
  'tshirt-v1': { id: 'tshirt-v1', name: 'T shirt (procedural spike asset)', surfaces: ['front'] },
}

export const GARMENT_COLOR = '#14141a'
export const SURFACE_SIZE = { w: 640, h: 640 }

const now = () => new Date().toISOString()

export function newProject({ code, name }) {
  return {
    id: uid(),
    schema: 1,
    code,                    // persistent Studio identity, e.g. "RFML 001"
    name: name || 'Untitled',
    createdAt: now(),
    updatedAt: now(),
    designs: [],             // Design[]
    sources: [],             // Source[] — project research record
    collections: [],         // Collection[]
    productionOutputs: [],   // ProductionOutput[]
  }
}

export function newDesign(project, { name, garmentTemplateId = 'tshirt-v1' } = {}) {
  const template = GARMENT_TEMPLATES[garmentTemplateId]
  if (!template) throw new Error(`Unknown garment template: ${garmentTemplateId}`)
  const design = {
    id: uid(),
    projectId: project.id,   // Design belongs to Project
    name: name || `Design ${String(project.designs.length + 1).padStart(2, '0')}`,
    garmentTemplateId,
    createdAt: now(),
    updatedAt: now(),
    // Working state: one Surface per garment surface; each Surface holds the
    // ordered layer stack of Elements.
    surfaces: Object.fromEntries(template.surfaces.map((s) => [s, newSurface(s)])),
    versions: [],            // Version[] — immutable snapshots
    thumbnail: null,         // small dataURL captured on save
  }
  design.surfaces.front.elements.push(
    newElement({
      kind: 'rect',
      name: 'Garment base',
      x: 0, y: 0, width: SURFACE_SIZE.w, height: SURFACE_SIZE.h,
      fill: GARMENT_COLOR, locked: true, classification: 'rfml_created',
    })
  )
  return design
}

export function newSurface(surfaceId) {
  return { id: surfaceId, elements: [] }
}

export function newElement(props) {
  const classification = props.classification || 'rfml_created'
  if (!CLASSIFICATIONS.includes(classification)) {
    throw new Error(`Invalid classification: ${classification}`)
  }
  return {
    id: uid(),
    kind: props.kind,        // rect | frame | text | image
    name: props.name || props.kind,
    x: props.x ?? 0, y: props.y ?? 0,
    rotation: props.rotation ?? 0,
    scaleX: props.scaleX ?? 1, scaleY: props.scaleY ?? 1,
    locked: !!props.locked,
    classification,          // source_material | rfml_created | rfml_transformed
    sourceIds: props.sourceIds ? [...props.sourceIds] : [],  // provenance links
    assetId: props.assetId ?? null,
    // kind-specific
    width: props.width, height: props.height,
    fill: props.fill, stroke: props.stroke, strokeWidth: props.strokeWidth,
    text: props.text, fontSize: props.fontSize, fontFamily: props.fontFamily,
    lineHeight: props.lineHeight,
    src: props.src,          // only for built-in (non-asset) images
  }
}

// Immutable snapshot of a design's working state.
export function newVersion(design, { label } = {}) {
  return {
    id: uid(),
    designId: design.id,     // Version belongs to Design
    label: label || `v${design.versions.length + 1}`,
    createdAt: now(),
    approved: false,
    state: structuredClone(design.surfaces),
  }
}

// Research source. Immutable once created: correct by superseding, never by
// overwriting (provenance principle).
export function newSource({ name, kind = 'image', note = '', rightsStatus = 'unknown', assetId = null, dateDiscovered } = {}) {
  if (!RIGHTS_STATES.includes(rightsStatus)) {
    throw new Error(`Invalid rights status: ${rightsStatus}`)
  }
  return Object.freeze({
    id: uid(),
    name: name || 'Untitled source',
    kind,
    note,
    rightsStatus,
    assetId,
    dateDiscovered: dateDiscovered || now(),
    createdAt: now(),
  })
}

// Extraction always connects back to its Source.
export function newExtraction({ sourceId, category, assetId = null, note = '' }) {
  if (!sourceId) throw new Error('Extraction requires a sourceId — provenance is not optional')
  return {
    id: uid(),
    sourceId,
    category,                // typography | palette | texture | mark | ...
    assetId,
    note,
    approved: false,         // human approval before permanent archive entry
    createdAt: now(),
  }
}

export function newExperiment(design, { name } = {}) {
  return {
    id: uid(),
    parentDesignId: design.id,
    name: name || `${design.name} — experiment`,
    createdAt: now(),
    state: structuredClone(design.surfaces),
  }
}

export function newCollection({ name } = {}) {
  return { id: uid(), name: name || 'Untitled collection', designIds: [], createdAt: now() }
}

// Production Output connects to an approved Version.
export function newProductionOutput(version, { format }) {
  if (!version.approved) {
    throw new Error('Production Output requires an approved Version')
  }
  return { id: uid(), versionId: version.id, format, createdAt: now() }
}
