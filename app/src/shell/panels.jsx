import React, { useState } from 'react'
import { CLASSIFICATIONS, RIGHTS_STATES } from '../engine/model.js'

const CLASS_LABELS = {
  rfml_created: 'RFML created',
  source_material: 'Source material',
  rfml_transformed: 'RFML transformed',
}

const FONTS = [
  ['Narrow', '"Arial Narrow", "Helvetica Neue", Arial, sans-serif'],
  ['Grotesk', 'Arial, "Helvetica Neue", sans-serif'],
  ['Serif', 'Georgia, "Times New Roman", serif'],
  ['Mono', '"Courier New", ui-monospace, monospace'],
  ['Block', 'Impact, "Arial Black", sans-serif'],
]

const BLENDS = ['normal', 'multiply', 'overlay', 'screen', 'soft-light', 'difference']
const MASKS = [['none', ''], ['circle', 'circle'], ['rounded', 'rounded']]

const fmtTime = (iso) => iso?.replace('T', ' ').slice(0, 19) || ''

// Collapsible panel: open on desktop, collapsed on phones so the canvas
// stays dominant (§8 mobile workspace).
export function Panel({ title, actions, defaultOpen, children }) {
  const [open, setOpen] = useState(
    defaultOpen ?? (typeof window === 'undefined' || window.innerWidth >= 1020)
  )
  return (
    <div className="panel">
      <div className="panel-head">
        <button className="panel-toggle" onClick={() => setOpen((o) => !o)}>
          {open ? '−' : '+'}
        </button>
        <span className="k">{title}</span>
        {actions}
      </div>
      {open && <div className="panel-body">{children}</div>}
    </div>
  )
}

export function LayersPanel({ elements, selectedId, onSelect, onToggleVisible, onToggleLock }) {
  return (
    <Panel title="LAYERS">
      {[...elements].reverse().map((o) => (
        <div
          className={`row layer-row${o.id === selectedId ? ' selected' : ''}`}
          key={o.id}
          onClick={() => onSelect(o.id)}
        >
          <button
            title={o.visible !== false ? 'Hide' : 'Show'}
            onClick={(e) => { e.stopPropagation(); onToggleVisible(o) }}
          >
            {o.visible !== false ? '●' : '○'}
          </button>
          <button
            title={o.locked ? 'Unlock' : 'Lock'}
            onClick={(e) => { e.stopPropagation(); onToggleLock(o) }}
          >
            {o.locked ? '■' : '□'}
          </button>
          <span className="row-main">{o.name}</span>
          <span className="row-sub">{o.kind}{o.kind === 'group' ? ` ×${o.children?.length}` : ''}</span>
        </div>
      ))}
    </Panel>
  )
}

function Field({ label, children }) {
  return (
    <label className="field prop-field">
      <span>{label}</span>
      {children}
    </label>
  )
}

export function PropertiesPanel({ element, onPatch, onCrop }) {
  if (!element) {
    return (
      <Panel title="PROPERTIES">
        <div className="empty">Nothing selected.</div>
      </Panel>
    )
  }
  const o = element
  const patch = (p) => onPatch(o.id, p)
  const isText = o.kind === 'text'
  const isImage = o.kind === 'image'
  const hasFill = o.kind === 'rect' || isText
  const hasStroke = o.kind === 'frame' || isText

  return (
    <Panel title={`PROPERTIES — ${o.name}`}>
      <div className="prop-grid">
        <Field label={`Opacity ${Math.round((o.opacity ?? 1) * 100)}%`}>
          <input type="range" min="0" max="1" step="0.05" value={o.opacity ?? 1}
            onChange={(e) => patch({ opacity: +e.target.value })} />
        </Field>
        <Field label="Blend">
          <select value={o.blend || 'normal'}
            onChange={(e) => patch({ blend: e.target.value === 'normal' ? null : e.target.value })}>
            {BLENDS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </Field>
        {hasFill && (
          <Field label="Colour">
            <input type="color" value={o.fill || '#e8e4da'}
              onChange={(e) => patch({ fill: e.target.value })} />
          </Field>
        )}
        {hasStroke && (
          <>
            <Field label={isText ? `Outline ${o.strokeWidth || 0}` : `Stroke ${o.strokeWidth || 0}`}>
              <input type="range" min="0" max="10" step="1" value={o.strokeWidth || 0}
                onChange={(e) => patch({ strokeWidth: +e.target.value })} />
            </Field>
            <Field label="Stroke colour">
              <input type="color" value={o.stroke || '#111111'}
                onChange={(e) => patch({ stroke: e.target.value })} />
            </Field>
          </>
        )}
        {isText && (
          <>
            <Field label="Font">
              <select value={o.fontFamily}
                onChange={(e) => patch({ fontFamily: e.target.value })}>
                {FONTS.map(([label, stack]) => (
                  <option key={label} value={stack}>{label}</option>
                ))}
                {!FONTS.some(([, s]) => s === o.fontFamily) && (
                  <option value={o.fontFamily}>custom</option>
                )}
              </select>
            </Field>
            <Field label={`Size ${o.fontSize}`}>
              <input type="range" min="10" max="180" step="1" value={o.fontSize}
                onChange={(e) => patch({ fontSize: +e.target.value })} />
            </Field>
            <Field label={`Tracking ${o.letterSpacing || 0}`}>
              <input type="range" min="-4" max="40" step="1" value={o.letterSpacing || 0}
                onChange={(e) => patch({ letterSpacing: +e.target.value })} />
            </Field>
            <Field label={`Leading ${(o.lineHeight ?? 1).toFixed(2)}`}>
              <input type="range" min="0.7" max="2" step="0.05" value={o.lineHeight ?? 1}
                onChange={(e) => patch({ lineHeight: +e.target.value })} />
            </Field>
            <Field label={`Shadow${o.shadowOn ? ' on' : ' off'}`}>
              <span className="prop-inline">
                <input type="checkbox" checked={!!o.shadowOn}
                  onChange={(e) => patch({ shadowOn: e.target.checked })} />
                <input type="color" value={o.shadowColor || '#000000'}
                  onChange={(e) => patch({ shadowColor: e.target.value })} />
              </span>
            </Field>
          </>
        )}
        {isImage && (
          <>
            <Field label="Mask">
              <select value={o.mask || ''}
                onChange={(e) => patch({ mask: e.target.value || null })}>
                {MASKS.map(([label, v]) => <option key={label} value={v}>{label}</option>)}
              </select>
            </Field>
            {!o.mask && (
              <Field label={o.crop ? 'Cropped' : 'Crop'}>
                <button onClick={() => onCrop(o.id)}>Crop…</button>
              </Field>
            )}
          </>
        )}
      </div>
    </Panel>
  )
}

export function VersionsPanel({ design, onSnapshot, onRestore }) {
  return (
    <Panel title="VERSIONS" actions={<button onClick={onSnapshot}>Snapshot</button>}>
      {design.versions.length === 0 && <div className="empty">No snapshots yet.</div>}
      {[...design.versions].reverse().map((v) => (
        <div className="row" key={v.id}>
          <span className="row-main">{v.label}</span>
          <span className="row-sub">{fmtTime(v.createdAt)}</span>
          <button onClick={() => onRestore(v.id)}>Restore</button>
        </div>
      ))}
    </Panel>
  )
}

export function ElementPanel({ element, sources, onClassify }) {
  return (
    <Panel title={element ? `PROVENANCE — ${element.name}` : 'PROVENANCE'} defaultOpen={false}>
      {!element && <div className="empty">Nothing selected.</div>}
      {element && (
        <>
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
          {element.sourceIds.length === 0 && (
            <div className="empty">
              {element.classification === 'rfml_created'
                ? 'RFML original — no external source.'
                : 'No source linked yet.'}
            </div>
          )}
          {element.sourceIds
            .map((id) => sources.find((s) => s.id === id))
            .filter(Boolean)
            .map((s) => (
              <div className="row" key={s.id}>
                <span className="row-main">{s.name}</span>
                <span className={`badge rights-${s.rightsStatus}`}>{s.rightsStatus.replace('_', ' ')}</span>
              </div>
            ))}
        </>
      )}
    </Panel>
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
    <Panel title="SOURCES — RESEARCH RECORD" defaultOpen={false}>
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
    </Panel>
  )
}
