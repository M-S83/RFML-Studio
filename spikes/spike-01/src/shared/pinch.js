// Two-finger pinch (scale) + twist (rotate) applied to the selected object.
// Works from raw pointer events on the editor container so the same gesture
// logic serves both canvas libraries.

export function attachPinch(el, { start, move, end }) {
  const pts = new Map()
  let base = null
  let d0 = 0
  let a0 = 0

  const two = () => [...pts.values()]
  const dist = () => {
    const [a, b] = two()
    return Math.hypot(b.x - a.x, b.y - a.y)
  }
  const angle = () => {
    const [a, b] = two()
    return Math.atan2(b.y - a.y, b.x - a.x)
  }

  const onDown = (e) => {
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pts.size === 2) {
      base = start() || null
      if (base) {
        d0 = dist()
        a0 = angle()
      }
    }
  }

  const onMove = (e) => {
    if (!pts.has(e.pointerId)) return
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pts.size === 2 && base && d0 > 0) {
      move(base, dist() / d0, ((angle() - a0) * 180) / Math.PI)
    }
  }

  const onUp = (e) => {
    const had = pts.delete(e.pointerId)
    if (had && pts.size < 2 && base) {
      end(base)
      base = null
    }
  }

  el.addEventListener('pointerdown', onDown)
  el.addEventListener('pointermove', onMove)
  el.addEventListener('pointerup', onUp)
  el.addEventListener('pointercancel', onUp)
  return () => {
    el.removeEventListener('pointerdown', onDown)
    el.removeEventListener('pointermove', onMove)
    el.removeEventListener('pointerup', onUp)
    el.removeEventListener('pointercancel', onUp)
  }
}
