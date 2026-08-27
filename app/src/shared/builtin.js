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
