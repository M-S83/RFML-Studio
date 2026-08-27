import React, { useState } from 'react'
import { CLASSIFICATIONS, RIGHTS_STATES } from '../engine/model.js'

const CLASS_LABELS = {
  rfml_created: 'RFML created',
  source_material: 'Source material',
  rfml_transformed: 'RFML transformed',
}

const fmtTime = (iso) => iso?.replace('T', ' ').slice(0, 19) || ''

export function VersionsPanel({ design, onSnapshot, onRestore }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <span className="k">VERSIONS</span>
        <button onClick={onSnapshot}>Snapshot</button>
      </div>
      <div className="panel-body">
        {design.versions.length === 0 && <div className="empty">No snapshots yet.</div>}
        {[...design.versions].reverse().map((v) => (
          <div className="row" key={v.id}>
            <span className="row-main">{v.label}</span>
            <span className="row-sub">{fmtTime(v.createdAt)}</span>
            <button onClick={() => onRestore(v.id)}>Restore</button>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ElementPanel({ element, sources, onClassify }) {
  if (!element) {
    return (
      <div className="panel">
        <div className="panel-head"><span className="k">ELEMENT</span></div>
        <div className="panel-body"><div className="empty">Nothing selected.</div></div>
      </div>
    )
  }
  const linked = element.sourceIds
    .map((id) => sources.find((s) => s.id === id))
    .filter(Boolean)
  return (
    <div className="panel">
      <div className="panel-head"><span className="k">ELEMENT — {element.name}</span></div>
      <div className="panel-body">
        <label className="field">
          <span>Classification</span>
          <select
            value={element.classification}
            onChange={(e) => onClassify(element.id, e.target.value)}
          >
            {CLASSIFICATIONS.map((c) => (
              <option key={c} value={c}>{CLASS_LABELS[c]}</option>
            ))}
          </select>
        </label>
        <div className="k" style={{ margin: '10px 0 4px' }}>WHERE DID THIS COME FROM?</div>
        {linked.length === 0 && (
          <div className="empty">
            {element.classification === 'rfml_created'
              ? 'RFML original — no external source.'
              : 'No source linked yet.'}
          </div>
        )}
        {linked.map((s) => (
          <div className="row" key={s.id}>
            <span className="row-main">{s.name}</span>
            <span className={`badge rights-${s.rightsStatus}`}>{s.rightsStatus.replace('_', ' ')}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SourcesPanel({ sources, assets, selectedElement, onAddSource, onLink, onPlace }) {
  const [name, setName] = useState('')
  const [rights, setRights] = useState('unknown')
  const [file, setFile] = useState(null)

  const submit = async () => {
    if (!name.trim()) return
    await onAddSource({ name: name.trim(), rightsStatus: rights, file })
    setName('')
    setRights('unknown')
    setFile(null)
  }

  return (
    <div className="panel">
      <div className="panel-head"><span className="k">SOURCES — RESEARCH RECORD</span></div>
      <div className="panel-body">
        {sources.length === 0 && <div className="empty">No sources attached to this project.</div>}
        {sources.map((s) => (
          <div className="source-row" key={s.id}>
            {s.assetId && assets?.[s.assetId] && (
              <img className="source-thumb" src={assets[s.assetId]} alt="" />
            )}
            <div className="source-main">
              <span className="row-main">{s.name}</span>
              <span className={`badge rights-${s.rightsStatus}`}>{s.rightsStatus.replace('_', ' ')}</span>
            </div>
            <div className="source-actions">
              {s.assetId && <button onClick={() => onPlace(s)}>Place</button>}
              <button disabled={!selectedElement || selectedElement.locked} onClick={() => onLink(s)}>
                Link
              </button>
            </div>
          </div>
        ))}
        <div className="new-source">
          <div className="k" style={{ margin: '8px 0 6px' }}>NEW SOURCE</div>
          <input
            placeholder="Source name (e.g. 1972 sleeve, photographed)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="new-source-row">
            <select value={rights} onChange={(e) => setRights(e.target.value)}>
              {RIGHTS_STATES.map((r) => (
                <option key={r} value={r}>{r.replace('_', ' ')}</option>
              ))}
            </select>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          <button onClick={submit} disabled={!name.trim()}>Add source</button>
        </div>
      </div>
    </div>
  )
}
