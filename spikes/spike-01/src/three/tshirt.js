import * as THREE from 'three'

// Procedural low-poly tee. Placeholder for the commissioned GLB asset
// (Development Plan §16): sensible topology, predictable front UV area,
// no baked branding. The silhouette spans a square bounding box so the
// 640x640 editor canvas maps without distortion.
//
// UVs on the front/back caps are remapped to the silhouette bounding box:
// u = (x - minX) / width, v = (y - minY) / height, so the editor canvas
// covers the full front. The back cap currently shows the same artwork
// mirrored — a known spike limitation, resolved by the real GLB with
// separate front/back UV islands.

export function buildTeeGeometry() {
  const s = new THREE.Shape()

  // Outline, y up, centred on origin. Span: x -50..50, y -50..50.
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

  const geometry = new THREE.ExtrudeGeometry(s, {
    depth: 9,
    bevelEnabled: true,
    bevelThickness: 2,
    bevelSize: 1.5,
    bevelSegments: 2,
    curveSegments: 12,
  })
  geometry.center()

  // Remap UVs to the bounding box so the canvas texture fills the front.
  geometry.computeBoundingBox()
  const bb = geometry.boundingBox
  const w = bb.max.x - bb.min.x
  const h = bb.max.y - bb.min.y
  const pos = geometry.attributes.position
  const uv = geometry.attributes.uv
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(
      i,
      (pos.getX(i) - bb.min.x) / w,
      (pos.getY(i) - bb.min.y) / h
    )
  }
  uv.needsUpdate = true
  geometry.computeVertexNormals()
  return geometry
}
