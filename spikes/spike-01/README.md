# Technology Spike 01 — Direct Manipulation + Live 3D T Shirt

The same small prototype built on each serious 2D canvas candidate, each
paired with the same live 3D T shirt driven directly by the 2D canvas
(Development Plan §6).

**Critical proof:** move a graphic in 2D and see it update on the 3D T shirt
without re-exporting or manually refreshing. **Proven for both candidates** —
the shirt's front material samples a `CanvasTexture` refreshed from the live
editor canvas on every changed frame.

## Run it

```
cd spikes/spike-01
npm install
npm run dev
```

Open the printed URL. For the mobile test (the primary acceptance test), open
the Network URL on a phone on the same network — the dev server binds to all
interfaces.

- `#/konva` — Candidate A: Konva / react-konva
- `#/fabric` — Candidate B: Fabric.js

Polotno SDK is excluded until its licensing is accepted (a Phase 0 decision,
Development Plan §5). If accepted, it enters as a third route on the same spec.

## Spec coverage

Both prototypes implement the full §6 spec against the identical seed
composition (locked garment base, thin frame, vinyl image, gold bar, stacked
title text — five overlapping objects):

| Requirement | Konva | Fabric |
| --- | --- | --- |
| Five overlapping objects, text, image, thin frame | yes | yes |
| Touch selection | yes | yes |
| Select the object underneath | tap the selected object again to cycle beneath | same gesture |
| Drag | yes | yes |
| Pinch scale / two-finger rotate | shared pointer-event gesture layer | same layer |
| Reorder | Forward / Backward | Forward / Backward |
| Lock | yes (locked objects stay selectable) | yes |
| Duplicate | yes | yes |
| Undo / redo | snapshots of the plain-data object list | `toJSON` snapshots + `loadFromJSON` |
| Save object state | localStorage, Save / Load | localStorage, Save / Load |
| 3D: orbit, zoom, front/back views | yes (shared viewer) | yes (shared viewer) |
| Live 2D → 3D texture update | zero-copy from the content layer canvas | `toCanvasElement()` re-render |

Verified headless (Chromium driver, no console errors in either editor):
select → drag → duplicate → drag duplicate → reorder → undo back to seed →
save → mutate → load restores. Screenshot evidence in `docs/`:

- `docs/konva-1-initial.png` — seed composition, live on the shirt
- `docs/konva-2-dragged.png` — vinyl dragged in 2D, shirt updated live
- `docs/fabric-3-duplicated-moved.png` — duplicate moved, shirt updated live
- `docs/fabric-6-back-view.png` — back view (mirrored artwork: known placeholder limitation)

## Findings

**Konva / react-konva**

- Layer separation means the content layer's canvas can be handed to the 3D
  texture zero-copy; selection handles live on an overlay layer and never
  touch the shirt.
- react-konva keeps the object list as plain React state — undo/redo, save,
  and later provenance attach to *our* data model, not the library's. This
  aligns directly with "2D and 3D share one design": the same data drives both
  views.
- No built-in text editing; an overlay editor must be built (known, standard
  pattern).

**Fabric.js**

- Richer built-ins: in-place text editing (double-click/tap) came free via
  `IText`; per-pixel target finding with tolerance made the thin frame
  forgiving to hit without extra code.
- Fabric renders the active object's controls into the content canvas, so
  texture capture needs a `toCanvasElement()` content-only re-render per
  changed frame — measurably more work during drags than Konva's zero-copy
  path.
- The canvas owns the data model; undo/redo goes through async
  `loadFromJSON`, and our own project schema would live alongside Fabric's
  serialization rather than being the single source of truth.

**Provisional recommendation: Konva / react-konva.** The decisive factors are
the clean live-texture path and that the project's own data model (the future
PROJECT/DESIGN/VERSION/LAYER/ELEMENT objects of Phase 2) naturally drives the
canvas rather than being derived from it. Fabric's text-editing UX is the
feature worth porting the idea from.

**The decision is not final until the mobile hardware test passes** — the
ten-step mobile test on a real phone is the primary acceptance test
(Development Plan §6), and desktop automation cannot stand in for it.

## Known limitations (deliberate spike scope)

- The T shirt is procedural (`src/three/tshirt.js`) — a stand-in for the
  commissioned GLB (§16). Its back cap mirrors the front artwork; the real
  asset's separate front/back UV islands resolve this.
- Two fingers on empty workspace does not yet pan/zoom the canvas (brief
  §5A); the gesture layer currently targets the selected object only.
- Fabric two-finger gestures can fight Fabric's own first-pointer drag
  handling; behaviour on real hardware is part of the mobile test.
- No grouping, masks, or crop — Phase 3 scope, not spike scope.
