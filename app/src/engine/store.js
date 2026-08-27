// The store: everything the app does to persistent state goes through here.
// Storage backend is the adapter in ./storage/local.js.

import * as db from './storage/local.js'
import { uid, formatCode } from './ids.js'
import { newProject, newDesign, newVersion, newSource } from './model.js'

const touch = (obj) => { obj.updatedAt = new Date().toISOString() }

// ---- Projects ----

export async function listProjects() {
  const projects = await db.getAll('projects')
  return projects.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
}

export async function loadProject(id) {
  return db.get('projects', id)
}

export async function saveProject(project) {
  touch(project)
  await db.put('projects', project)
  return project
}

// Studio identity counter — codes are assigned once and never reused, even
// if a project is deleted.
export async function nextProjectCode() {
  const meta = (await db.get('meta', 'projectCounter')) || { k: 'projectCounter', n: 0 }
  meta.n += 1
  await db.put('meta', meta)
  return formatCode('RFML', meta.n)
}

export async function createProject(name) {
  const code = await nextProjectCode()
  const project = newProject({ code, name })
  project.designs.push(newDesign(project, {}))
  await saveProject(project)
  return project
}

// ---- Designs ----

export function addDesign(project, opts = {}) {
  const design = newDesign(project, opts)
  project.designs.push(design)
  return design
}

export function duplicateDesign(project, designId) {
  const src = project.designs.find((d) => d.id === designId)
  if (!src) throw new Error('Design not found')
  const copy = structuredClone(src)
  copy.id = uid()
  copy.name = src.name + ' copy'
  copy.createdAt = new Date().toISOString()
  copy.updatedAt = copy.createdAt
  // The copy starts its own version history; provenance links on elements
  // survive because sources are project-level.
  copy.versions = []
  project.designs.push(copy)
  return copy
}

// ---- Versions ----

export function snapshotVersion(design, label) {
  const version = newVersion(design, { label })
  design.versions.push(version)
  touch(design)
  return version
}

export function restoreVersion(design, versionId) {
  const version = design.versions.find((v) => v.id === versionId)
  if (!version) throw new Error('Version not found')
  design.surfaces = structuredClone(version.state)
  touch(design)
  return design
}

// ---- Sources & provenance ----

export function addSource(project, props) {
  const source = newSource(props)
  project.sources.push(source)
  return source
}

export function linkSourceToElement(element, sourceId) {
  if (!element.sourceIds.includes(sourceId)) element.sourceIds.push(sourceId)
  if (element.classification === 'rfml_created') element.classification = 'rfml_transformed'
  return element
}

// Answers "where did this element come from?" from inside the project.
export function provenanceOf(project, element) {
  return element.sourceIds
    .map((id) => project.sources.find((s) => s.id === id))
    .filter(Boolean)
}

// ---- Assets ----
// The original file is stored once and never overwritten; everything that
// uses it references the assetId.

export async function putAsset(dataUrl, meta = {}) {
  const asset = { id: uid(), dataUrl, ...meta, createdAt: new Date().toISOString() }
  await db.put('assets', asset)
  return asset
}

export async function getAsset(id) {
  return db.get('assets', id)
}

export async function getAssetMap(ids) {
  const map = {}
  for (const id of [...new Set(ids)].filter(Boolean)) {
    const a = await db.get('assets', id)
    if (a) map[id] = a.dataUrl
  }
  return map
}
