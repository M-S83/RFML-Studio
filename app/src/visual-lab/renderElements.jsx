import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Stage, Layer, Group as KGroup, Rect, Text, Image as KImage } from 'react-konva'
import { SURFACE_SIZE, normalizeElement } from '../engine/model.js'

// Shared element-rendering helpers for the interactive editor and the
// static (hidden) surface renderer.

export function useHtmlImage(src) {
  const [img, setImg] = useState(null)
  useEffect(() => {
    if (!src) return
    const i = new window.Image()
    i.onload = () => setImg(i)
    i.src = src
  }, [src])
  return img
}

export function maskClipFunc(o) {
  const w = o.width
  const h = o.height
  if (o.mask === 'circle') {
    return (ctx) => {
      ctx.beginPath()
      ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2)
      ctx.closePath()
    }
  }
  if (o.mask === 'rounded') {
    const r = Math.min(w, h) * 0.16
    return (ctx) => {
      ctx.beginPath()
      ctx.moveTo(r, 0)
      ctx.arcTo(w, 0, w, h, r)
      ctx.arcTo(w, h, 0, h, r)
      ctx.arcTo(0, h, 0, 0, r)
      ctx.arcTo(0, 0, w, 0, r)
      ctx.closePath()
    }
  }
  return undefined
}

export const shadowProps = (o) =>
  o.shadowOn
    ? { shadowColor: o.shadowColor || '#000000', shadowBlur: 10, shadowOffsetX: 5, shadowOffsetY: 5, shadowOpacity: 0.7 }
    : {}

const staticCommon = (o) => ({
  x: o.x, y: o.y, rotation: o.rotation, scaleX: o.scaleX, scaleY: o.scaleY,
  opacity: o.opacity ?? 1, visible: o.visible !== false,
  globalCompositeOperation: o.blend || undefined,
  listening: false,
})

function StaticImage({ o, assets }) {
  const img = useHtmlImage(o.assetId ? assets?.[o.assetId] : o.src)
  const imageProps = { image: img, width: o.width, height: o.height, crop: o.crop || undefined }
  if (o.mask) {
    return (
      <KGroup {...staticCommon(o)} clipFunc={maskClipFunc(o)}>
        <KImage {...imageProps} />
      </KGroup>
    )
  }
  return <KImage {...imageProps} {...staticCommon(o)} />
}

export function StaticElement({ o, assets }) {
  const common = staticCommon(o)
  if (o.kind === 'group')
    return (
      <KGroup {...common}>
        {o.children.map((c) => <StaticElement key={c.id} o={c} assets={assets} />)}
      </KGroup>
    )
  if (o.kind === 'rect')
    return <Rect width={o.width} height={o.height} fill={o.fill} {...shadowProps(o)} {...common} />
  if (o.kind === 'frame')
    return (
      <Rect width={o.width} height={o.height} stroke={o.stroke}
        strokeWidth={o.strokeWidth} fillEnabled={false} {...common} />
    )
  if (o.kind === 'text')
    return (
      <Text text={o.text} fontSize={o.fontSize} fontFamily={o.fontFamily}
        fontStyle="bold" fill={o.fill} lineHeight={o.lineHeight}
        letterSpacing={o.letterSpacing || 0}
        stroke={o.strokeWidth ? o.stroke : undefined}
        strokeWidth={o.strokeWidth || 0}
        fillAfterStrokeEnabled
        {...shadowProps(o)} {...common} />
    )
  if (o.kind === 'image') return <StaticImage o={o} assets={assets} />
  return null
}

// Hidden live renderer for a non-active surface: keeps that surface's canvas
// painted so the 3D garment can texture from it while the user edits the
// other side. Bumps `bumpRef` on every draw so the viewer refreshes.
export const SurfaceRender = forwardRef(function SurfaceRender({ elements, assets, bumpRef }, ref) {
  const layerRef = useRef(null)
  useImperativeHandle(ref, () => ({
    getCanvas: () => layerRef.current?.getCanvas()._canvas || null,
  }))
  useEffect(() => {
    const layer = layerRef.current
    if (!layer || !bumpRef) return
    const bump = () => { bumpRef.current++ }
    layer.on('draw', bump)
    return () => layer.off('draw', bump)
  }, [bumpRef])
  const els = elements.map(normalizeElement)
  return (
    <div style={{ display: 'none' }} aria-hidden="true">
      <Stage width={SURFACE_SIZE.w} height={SURFACE_SIZE.h} listening={false}>
        <Layer ref={layerRef}>
          {els.map((o) => <StaticElement key={o.id} o={o} assets={assets} />)}
        </Layer>
      </Stage>
    </div>
  )
})
