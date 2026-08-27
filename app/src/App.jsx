import React, { useEffect, useState } from 'react'
import Home from './shell/Home.jsx'
import ProjectView from './shell/ProjectView.jsx'

function useHashRoute() {
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => {
    const onChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return hash.replace(/^#\/?/, '')
}

export default function App() {
  const route = useHashRoute()
  const parts = route.split('/').filter(Boolean) // p/<pid>[/d/<did>]
  const projectId = parts[0] === 'p' ? parts[1] : null
  const designId = parts[2] === 'd' ? parts[3] : null

  return (
    <div className="page">
      <div className="topbar">
        <h1><a href="#/" style={{ textDecoration: 'none', color: 'inherit' }}>RFML Studio</a></h1>
        <span className="tag">V1 CORE ENGINE</span>
        <span className="spacer" />
      </div>
      {projectId ? (
        <ProjectView key={projectId + ':' + (designId || '')} projectId={projectId} designId={designId} />
      ) : (
        <Home />
      )}
    </div>
  )
}
