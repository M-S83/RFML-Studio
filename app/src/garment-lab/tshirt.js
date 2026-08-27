import * as THREE from 'three'

// Procedural low-poly tee. Placeholder for the commissioned GLB asset
// (Development Plan §16). Phase 4 architecture: the extruded body carries
// the garment colour, and two separate silhouette "print surfaces" carry
// the front and back artwork — so front and back are independent, exactly
// as the real GLB's UV islands will be. Sleeves are part of the silhouette,
// so artwork extends onto them (initial sleeve support, §9).

export function teeShape() {
  const s = new THREE.Shape()
  // Outline, y up, centred on origin. Span: x -50..50, y -50..46.
  s.moveTo(-30, -50)              // bottom left of body
  s.lineTo(-30, 16)               // left side up to armpit
  s.lineTo(-50, 8)                // under-sleeve out to sleeve opening
  s.lineTo(-45, 33)               // sleeve opening up to shoulder tip
  s.lineTo(-13, 46)               // shoulder in to neck
  s.quadraticCurveTo(0, 34, 13, 46)  // neck dip
  s.lineTo(45, 33)                // shoulder out
  s.lineTo(50, 8)                 // sleeve opening down
  s.lineTo(30, 16)                // under-sleeve back to armpit
  s.lineTo(30, -50)               // right side down
  s.lineTo(-30, -50)              // hem
  return s
}

function remapUVsToBBox(geometry) {
  geometry.computeBoundingBox()
  const bb = geometry.boundingBox
  const w = bb.max.x - bb.min.x
  const h = bb.max.y - bb.min.y
  const pos = geometry.attributes.position
  const uv = geometry.attributes.uv
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, (pos.getX(i) - bb.min.x) / w, (pos.getY(i) - bb.min.y) / h)
  }
  uv.needsUpdate = true
}

// The garment body: plain-coloured, no artwork.
export function buildTeeGeometry() {
  const geometry = new THREE.ExtrudeGeometry(teeShape(), {
    depth: 9,
    bevelEnabled: true,
    bevelThickness: 2,
    bevelSize: 1.5,
    bevelSegments: 2,
    curveSegments: 12,
  })
  geometry.center()
  geometry.computeVertexNormals()
  return geometry
}

// A flat silhouette surface for one side's artwork. UVs map the silhouette
// bounding box to the full editor canvas — the same linear mapping front and
// back, so artwork scale stays consistent between surfaces.
export function buildPrintGeometry() {
  const geometry = new THREE.ShapeGeometry(teeShape(), 12)
  geometry.center()
  remapUVsToBBox(geometry)
  return geometry
}

// z offset that floats a print surface just off the body (half depth +
// bevel + clearance).
export const PRINT_Z = 9 / 2 + 2 + 0.35
