# RFML Studio — Application (V1 Core Project Engine)

The production application, started at Phase 2 of the Development Plan.

```
cd app
npm install
npm run dev
```

Open the printed URL (Network URL for phones). Everything persists in the
browser via IndexedDB — no backend yet.

## What works (Phase 2 — Core Project Engine, Development Plan §7)

- **Create project** from Studio Home, with a persistent Studio identity
  (`RFML 001`, `RFML 002`, …) that is assigned once and never reused (§24).
- **Save + autosave** — every committed change writes through the store after
  a short debounce; the save indicator shows the last write.
- **Reopen** — exit condition met: a design can be closed (page reloaded,
  browser restarted) and reopened exactly where it was left.
- **Version snapshots** — immutable copies of the design state; restore any
  snapshot from the Versions panel.
- **Duplicate design** — from the project overview.
- **Basic asset storage** — uploaded source images are stored once in the
  asset store and referenced by id; originals are never overwritten.
- **Provenance** — sources carry rights status (`unknown / research only /
  cleared / RFML original`); elements carry a classification (`RFML created /
  source material / RFML transformed`) and source links. The Element panel
  answers "where did this element come from?" from inside the project.
- The Phase 1 editor and live 3D tee carry over: direct manipulation canvas
  (Konva) with the live-texture Object Mode view.

## What works (Phase 3 — V1 Visual Lab, Development Plan §8)

- **Grouping** — Multi mode (or shift-click) builds a selection; Group wraps
  it into a group element, Ungroup dissolves it with composed transforms.
- **Layers panel** — stack order top-first with per-layer visibility and lock
  toggles; click to select (robust selection even for covered objects).
- **Crop** — image elements get a crop mode (move/resize the region, Apply);
  crops compose and are stored in source-image pixels.
- **Basic masks** — circle and rounded-rect clip masks on images.
- **Opacity + blend** — per element; multiply/overlay/screen/soft-light/difference.
- **Typography** — font selection, size, tracking, leading, colour, outline,
  shadow; double-click/tap a text element to edit it in place.
- **Image upload** — straight into the canvas via the asset store.
- **Basic texture** — generated grain (overlay) and halftone (multiply)
  full-bleed texture elements.
- **Copy/paste + keyboard** — Ctrl/Cmd C/V, Ctrl/Cmd Z / Shift-Z, Delete, Escape.
- **Mobile workspace** — canvas-dominant layout, collapsible panels,
  forgiving touch targets.

All Phase 3 properties persist through the Phase 2 engine (regression-checked:
reload restores identical state).

## What works (Phase 4 — V1 Garment Lab, Development Plan §9)

- **Front and back mapping** — FRONT/BACK tabs switch which surface the
  canvas edits; each surface holds its own layer stack, and the 3D tee
  carries both at once (the inactive surface renders live from a hidden
  canvas). The back reads correctly — no mirroring.
- **Project-linked garment colour** — one colour control drives the 3D body
  and the locked "Garment base" rect on every surface.
- **Sleeve support** — artwork extends onto the sleeve area of the
  silhouette (full-silhouette print surfaces).
- **High-quality preview capture** — Capture button downloads a PNG of the
  current 3D view.
- Orbit, zoom, Front/Back/Reset quick views carry over from the spike.
- §9 acceptance: create artwork in 2D, rotate the shirt, inspect the result
  without leaving the project — verified headless with independent
  front/back artwork.
- Existing designs migrate automatically (back surface + garment colour
  added on first open).

The tee is still the procedural placeholder for the commissioned GLB (§16);
its architecture — body + separate per-surface print geometry — is the same
shape the GLB's UV islands will take.

## Architecture

```
src/engine/        the core model and persistence (no UI)
  model.js         the eleven §7 core objects + enforced relationships
  ids.js           stable ids + Studio code formatting
  store.js         the only API the app uses to touch persistent state
  storage/local.js IndexedDB adapter (swappable for Supabase later)
src/shell/         Studio Home, project view, panels
src/visual-lab/    the direct-manipulation canvas (engine-backed)
src/garment-lab/   procedural tee + live CanvasTexture viewer
src/shared/        gesture layer, undo history, built-in artwork
```

The store API is the seam for the future backend: `storage/local.js` is the
only file that knows persistence is IndexedDB.

## Verified

Headless Chromium run, 12/12 checks: create project → compose → attach source
with uploaded file → place + link (classification flows) → snapshot → edit →
**reload page → identical element state** → restore snapshot → duplicate
design → home shows thumbnail. No console errors.
