// Built-in placeholder artwork (RFML-created, no external source).

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

// Basic textures (Phase 3), generated once per session in the browser.
// Grain: monochrome noise, meant for 'overlay'/'soft-light' blending.
// Halftone: dot grid, meant for 'multiply'.
function makeCanvas(size) {
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  return c
}

let grainUrl = null
export function grainTexture() {
  if (grainUrl) return grainUrl
  const c = makeCanvas(320)
  const ctx = c.getContext('2d')
  const img = ctx.createImageData(320, 320)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 96 + Math.floor(Math.random() * 128)
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v
    img.data[i + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  grainUrl = c.toDataURL('image/png')
  return grainUrl
}

let halftoneUrl = null
export function halftoneTexture() {
  if (halftoneUrl) return halftoneUrl
  const c = makeCanvas(320)
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 320, 320)
  ctx.fillStyle = '#111111'
  const step = 10
  for (let y = 0; y < 320; y += step) {
    for (let x = 0; x < 320; x += step) {
      const r = 1.2 + 2.4 * Math.abs(Math.sin((x + y) / 41))
      ctx.beginPath()
      ctx.arc(x + step / 2, y + step / 2, r, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  halftoneUrl = c.toDataURL('image/png')
  return halftoneUrl
}
