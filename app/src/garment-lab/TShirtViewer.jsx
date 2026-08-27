import React, { useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { buildTeeGeometry, buildPrintGeometry, PRINT_Z } from './tshirt.js'

const TEX_SIZE = 1024

function useLiveTexture(fallbackColor) {
  const canvas = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = TEX_SIZE
    c.height = TEX_SIZE
    return c
  }, [])
  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return t
  }, [canvas])
  const refresh = (src) => {
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = fallbackColor
    ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE)
    if (src && src.width) ctx.drawImage(src, 0, 0, TEX_SIZE, TEX_SIZE)
    texture.needsUpdate = true
  }
  return { texture, refresh }
}

// Front and back are separate live textures driven by their surface canvases;
// the body is a plain material in the design's garment colour.
function Tee({ getFrontCanvas, getBackCanvas, versionRef, garmentColor }) {
  const bodyGeometry = useMemo(() => buildTeeGeometry(), [])
  const printGeometry = useMemo(() => buildPrintGeometry(), [])
  const front = useLiveTexture(garmentColor)
  const back = useLiveTexture(garmentColor)

  const lastVersion = useRef(-1)
  const lastColor = useRef(null)
  useFrame(() => {
    if (versionRef.current === lastVersion.current && lastColor.current === garmentColor) return
    front.refresh(getFrontCanvas?.())
    back.refresh(getBackCanvas?.())
    lastVersion.current = versionRef.current
    lastColor.current = garmentColor
  })

  return (
    <group>
      <mesh geometry={bodyGeometry}>
        <meshStandardMaterial color={garmentColor} roughness={0.9} metalness={0} />
      </mesh>
      <mesh geometry={printGeometry} position={[0, 0, PRINT_Z]}>
        <meshStandardMaterial map={front.texture} roughness={0.85} metalness={0} />
      </mesh>
      <mesh geometry={printGeometry} position={[0, 0, -PRINT_Z]} rotation={[0, Math.PI, 0]}>
        <meshStandardMaterial map={back.texture} roughness={0.85} metalness={0} />
      </mesh>
    </group>
  )
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

// High-quality preview capture: reads the WebGL canvas on the frame after a
// capture is requested.
function CaptureRig({ captureRef, onCapture }) {
  const gl = useThree((s) => s.gl)
  useFrame(() => {
    if (!captureRef.current) return
    captureRef.current = false
    try {
      onCapture?.(gl.domElement.toDataURL('image/png'))
    } catch { /* capture is best-effort */ }
  })
  return null
}

export default function TShirtViewer({
  getFrontCanvas,
  getBackCanvas,
  versionRef,
  garmentColor = '#14141a',
  onGarmentColor,
  onCapture,
  label,
}) {
  const cmdRef = useRef(null)
  const captureRef = useRef(false)
  return (
    <div className="viewer-panel">
      <div className="viewer-head">
        <span className="k">OBJECT MODE {label ? `· ${label}` : ''}</span>
        {onGarmentColor && (
          <input
            type="color"
            className="garment-color"
            title="Garment colour"
            value={garmentColor}
            onChange={(e) => onGarmentColor(e.target.value)}
          />
        )}
        <button onClick={() => (cmdRef.current = 'front')}>Front</button>
        <button onClick={() => (cmdRef.current = 'back')}>Back</button>
        <button onClick={() => (cmdRef.current = 'side')}>Reset</button>
        {onCapture && (
          <button onClick={() => (captureRef.current = true)}>Capture</button>
        )}
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
          <directionalLight position={[-70, 30, -120]} intensity={0.9} />
          <Tee
            getFrontCanvas={getFrontCanvas}
            getBackCanvas={getBackCanvas}
            versionRef={versionRef}
            garmentColor={garmentColor}
          />
          <OrbitControls makeDefault enablePan={false} minDistance={90} maxDistance={340} />
          <CameraRig cmdRef={cmdRef} />
          <CaptureRig captureRef={captureRef} onCapture={onCapture} />
        </Canvas>
      </div>
    </div>
  )
}
