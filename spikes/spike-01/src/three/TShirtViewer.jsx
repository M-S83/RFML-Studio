import React, { useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { buildTeeGeometry } from './tshirt.js'
import { GARMENT_COLOR } from '../shared/seed.js'

const TEX_SIZE = 1024

// The critical proof of the spike: the shirt's front material samples a
// CanvasTexture copied from the live editor canvas. Whenever the editor
// bumps versionRef, the texture refreshes on the next rendered frame —
// no export, no snapshot button, no manual refresh.
function Tee({ getSourceCanvas, versionRef }) {
  const geometry = useMemo(() => buildTeeGeometry(), [])

  const texCanvas = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = TEX_SIZE
    c.height = TEX_SIZE
    const ctx = c.getContext('2d')
    ctx.fillStyle = GARMENT_COLOR
    ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE)
    return c
  }, [])

  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(texCanvas)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return t
  }, [texCanvas])

  const materials = useMemo(
    () => [
      new THREE.MeshStandardMaterial({ map: texture, roughness: 0.85, metalness: 0 }),
      new THREE.MeshStandardMaterial({ color: '#1b1b21', roughness: 0.9, metalness: 0 }),
    ],
    [texture]
  )

  const lastVersion = useRef(-1)
  useFrame(() => {
    if (versionRef.current === lastVersion.current) return
    const src = getSourceCanvas()
    if (!src || !src.width) return
    const ctx = texCanvas.getContext('2d')
    ctx.fillStyle = GARMENT_COLOR
    ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE)
    ctx.drawImage(src, 0, 0, TEX_SIZE, TEX_SIZE)
    texture.needsUpdate = true
    lastVersion.current = versionRef.current
  })

  return <mesh geometry={geometry} material={materials} />
}

function CameraRig({ cmdRef }) {
  const controls = useThree((s) => s.controls)
  const camera = useThree((s) => s.camera)
  useFrame(() => {
    const cmd = cmdRef.current
    if (!cmd || !controls) return
    cmdRef.current = null
    const dist = 195
    if (cmd === 'front') camera.position.set(0, 0, dist)
    if (cmd === 'back') camera.position.set(0, 0, -dist)
    if (cmd === 'side') camera.position.set(dist * 0.85, 18, dist * 0.5)
    controls.target.set(0, 0, 0)
    controls.update()
  })
  return null
}

export default function TShirtViewer({ getSourceCanvas, versionRef, label }) {
  const cmdRef = useRef(null)
  return (
    <div className="viewer-panel">
      <div className="viewer-head">
        <span className="k">OBJECT MODE — LIVE 3D {label ? `· ${label}` : ''}</span>
        <button onClick={() => (cmdRef.current = 'front')}>Front</button>
        <button onClick={() => (cmdRef.current = 'back')}>Back</button>
        <button onClick={() => (cmdRef.current = 'side')}>Reset</button>
      </div>
      <div className="viewer-canvas">
        <Canvas
          camera={{ position: [55, 15, 165], fov: 38 }}
          dpr={[1, 2]}
          gl={{ antialias: true, preserveDrawingBuffer: true }}
        >
          <color attach="background" args={['#eceadf']} />
          <hemisphereLight intensity={1.1} groundColor="#7a7466" />
          <directionalLight position={[60, 80, 120]} intensity={1.4} />
          <directionalLight position={[-70, 30, -120]} intensity={0.5} />
          <Tee getSourceCanvas={getSourceCanvas} versionRef={versionRef} />
          <OrbitControls makeDefault enablePan={false} minDistance={90} maxDistance={340} />
          <CameraRig cmdRef={cmdRef} />
        </Canvas>
      </div>
    </div>
  )
}
