// The identical starting composition used by both editor prototypes,
// so the comparison between canvas foundations is fair.

export const CANVAS = { w: 640, h: 640 }
export const GARMENT_COLOR = '#14141a'

const vinylSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="260" height="260">
  <circle cx="130" cy="130" r="128" fill="#161616" stroke="#2c2c2c" stroke-width="2"/>
  <circle cx="130" cy="130" r="112" fill="none" stroke="#242424" stroke-width="1.5"/>
  <circle cx="130" cy="130" r="96" fill="none" stroke="#202020" stroke-width="1.5"/>
  <circle cx="130" cy="130" r="80" fill="none" stroke="#242424" stroke-width="1.5"/>
  <circle cx="130" cy="130" r="64" fill="none" stroke="#202020" stroke-width="1.5"/>
  <circle cx="130" cy="130" r="44" fill="#c8452c"/>
  <circle cx="130" cy="130" r="44" fill="none" stroke="#8f2f1d" stroke-width="1"/>
  <circle cx="130" cy="130" r="5" fill="#0e0e0e"/>
  <rect x="98" y="112" width="64" height="10" fill="#efe9dc" opacity="0.9"/>
  <rect x="106" y="140" width="48" height="6" fill="#efe9dc" opacity="0.7"/>
</svg>`

export const VINYL_SRC =
  'data:image/svg+xml;utf8,' + encodeURIComponent(vinylSvg.trim())

let idCounter = 100
export const nextId = (prefix) => `${prefix}-${idCounter++}`

const defaults = {
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  locked: false,
}

// Five overlapping objects: locked garment base, thin frame, image, bar, text.
export function seedObjects() {
  return [
    {
      ...defaults,
      id: 'bg',
      kind: 'rect',
      name: 'Garment base',
      x: 0, y: 0, width: CANVAS.w, height: CANVAS.h,
      fill: GARMENT_COLOR,
      locked: true,
    },
    {
      ...defaults,
      id: 'frame',
      kind: 'frame',
      name: 'Thin frame',
      x: 96, y: 76, width: 448, height: 488,
      stroke: '#e8e4da', strokeWidth: 2,
    },
    {
      ...defaults,
      id: 'vinyl',
      kind: 'image',
      name: 'Vinyl record',
      x: 170, y: 110, width: 300, height: 300,
      src: VINYL_SRC,
    },
    {
      ...defaults,
      id: 'bar',
      kind: 'rect',
      name: 'Gold bar',
      x: 150, y: 356, width: 340, height: 34,
      fill: '#c99a2e', rotation: -4,
    },
    {
      ...defaults,
      id: 'title',
      kind: 'text',
      name: 'Title',
      x: 152, y: 402,
      text: 'REGGAE\nFRAMED\nMY LIFE',
      fontSize: 56, fill: '#efe9dc', lineHeight: 1.02,
      fontFamily: '"Arial Narrow", "Helvetica Neue", Arial, sans-serif',
    },
  ]
}

export function makeObject(kind) {
  switch (kind) {
    case 'text':
      return {
        ...defaults, id: nextId('text'), kind: 'text', name: 'Text',
        x: 200, y: 200, text: 'DUB', fontSize: 64, fill: '#e8e4da',
        lineHeight: 1.02,
        fontFamily: '"Arial Narrow", "Helvetica Neue", Arial, sans-serif',
      }
    case 'image':
      return {
        ...defaults, id: nextId('img'), kind: 'image', name: 'Image',
        x: 220, y: 220, width: 200, height: 200, src: VINYL_SRC,
      }
    case 'frame':
      return {
        ...defaults, id: nextId('frame'), kind: 'frame', name: 'Frame',
        x: 160, y: 160, width: 320, height: 320,
        stroke: '#c8452c', strokeWidth: 2,
      }
    case 'rect':
    default:
      return {
        ...defaults, id: nextId('bar'), kind: 'rect', name: 'Bar',
        x: 180, y: 300, width: 280, height: 30, fill: '#3d7a3a',
      }
  }
}
