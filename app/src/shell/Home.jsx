import React, { useEffect, useState } from 'react'
import { listProjects, createProject } from '../engine/store.js'

const fmtTime = (iso) => iso?.replace('T', ' ').slice(0, 16) || ''

// Studio Home: recent visual work dominates; New Work starts a project with
// a persistent Studio identity.
export default function Home() {
  const [projects, setProjects] = useState(null)
  const [name, setName] = useState('')

  useEffect(() => {
    listProjects().then(setProjects)
  }, [])

  const newWork = async () => {
    const project = await createProject(name.trim() || 'Untitled')
    window.location.hash = `#/p/${project.id}`
  }

  return (
    <div className="home">
      <h2>Workbench</h2>
      <div className="new-work">
        <input
          placeholder="Project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && newWork()}
        />
        <button className="primary" onClick={newWork}>New Work</button>
      </div>

      {projects === null && <p className="lede">Loading…</p>}
      {projects?.length === 0 && (
        <p className="lede">No projects yet. Start a piece of new work above.</p>
      )}
      <div className="cards">
        {projects?.map((p) => {
          const thumb = p.designs.find((d) => d.thumbnail)?.thumbnail
          return (
            <a className="card project-card" key={p.id} href={`#/p/${p.id}`}>
              {thumb ? (
                <img className="card-thumb" src={thumb} alt="" />
              ) : (
                <div className="card-thumb placeholder" />
              )}
              <span className="k">{p.code}</span>
              <strong>{p.name}</strong>
              <span className="row-sub">
                {p.designs.length} design{p.designs.length === 1 ? '' : 's'} · {fmtTime(p.updatedAt)}
              </span>
            </a>
          )
        })}
      </div>
    </div>
  )
}
