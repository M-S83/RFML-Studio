import React, { useEffect, useState } from 'react'
import KonvaEditor from './konva/KonvaEditor.jsx'
import FabricEditor from './fabric/FabricEditor.jsx'

function useHashRoute() {
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => {
    const onChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return hash
}

const MOBILE_TEST = [
  'Add five objects.',
  'Move them into a composition.',
  'Put one behind another.',
  'Select the object underneath.',
  'Resize it.',
  'Rotate it.',
  'Duplicate it.',
  'Move the duplicate.',
  'Lock a background.',
  'Rearrange the composition.',
]

function Home() {
  return (
    <div className="home">
      <h2>Direct Manipulation + Live 3D T Shirt</h2>
      <p className="lede">
        The same small prototype built on each serious 2D canvas candidate,
        each paired with the same live 3D T shirt driven directly by the 2D
        canvas. Critical proof: move a graphic in 2D and see it update on the
        3D T shirt without re-exporting or manually refreshing.
      </p>
      <div className="cards">
        <a className="card" href="#/konva">
          <span className="k">CANDIDATE A</span>
          <strong>Konva / react-konva</strong>
        </a>
        <a className="card" href="#/fabric">
          <span className="k">CANDIDATE B</span>
          <strong>Fabric.js</strong>
        </a>
      </div>
      <p className="lede">
        <strong>Mobile test</strong> (a new user should complete this without
        instructions):
      </p>
      <ol>
        {MOBILE_TEST.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <p className="lede">
        Polotno SDK is excluded until its licensing is accepted (Phase 0
        decision, Development Plan §5). The T shirt is a procedural placeholder
        for the commissioned GLB (§16).
      </p>
    </div>
  )
}

export default function App() {
  const hash = useHashRoute()
  const route = hash.replace(/^#\/?/, '')
  return (
    <div className="page">
      <div className="topbar">
        <h1>RFML Studio</h1>
        <span className="tag">SPIKE 01</span>
        <span className="spacer" />
        {route ? <a href="#/">← Back</a> : null}
        {route === 'konva' && <span className="tag">KONVA</span>}
        {route === 'fabric' && <span className="tag">FABRIC</span>}
      </div>
      {route === 'konva' ? <KonvaEditor /> : route === 'fabric' ? <FabricEditor /> : <Home />}
    </div>
  )
}
