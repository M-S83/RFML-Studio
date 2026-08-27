# RFML Studio

Creative research, design and production environment for **Reggae Framed My Life**.

RFML Studio connects research, visual analysis, experimentation, original design, physical production and permanent archive. 2D artwork and live 3D garments are two views of the same project data, and every visual element keeps its provenance — the system can always answer *"where did this come from?"*.

The core creative loop the first milestone must prove:

```
RESEARCH MATERIAL → 2D ARTWORK → LIVE 3D GARMENT → SAVE → REOPEN → CONTINUE
```

## Governing documents

Product documentation is versioned with the codebase (see `docs/`):

| Document | Role |
| --- | --- |
| [Master Functional Brief v1.2](docs/RFML_Studio_Master_Functional_Brief_v1.2.md) | What Studio ultimately needs to become |
| [Development Plan v1.0](docs/RFML_Studio_Development_Plan_v1.0.md) | The current sequence for getting there |
| [Decision Log](docs/DECISION_LOG.md) | Why major technical and product decisions were made |

## Current phase

**Phase 3 — V1 Visual Lab: complete.** The application lives in
[`app/`](app/). On top of the Phase 2 engine (projects with persistent
Studio identities, autosave, exact reopen, versions, provenance), the
Visual Lab now covers the §8 set: grouping, layers panel with visibility
and locking, crop, basic masks, opacity and blend modes, full typography
controls with in-place editing, image upload, generated textures,
copy/paste and keyboard shortcuts, and a canvas-dominant mobile
workspace. Next: **Phase 4 — V1 Garment Lab** (front/back surface
mapping, garment colour, view polish, high-quality preview capture) —
best started once the commissioned T-shirt GLB (§16) exists.

### Phase 1 — Technology Spike 01 (done)

Before building the production application, small prototypes must choose the 2D canvas foundation (Konva, Fabric.js, Polotno) and prove live 2D → 3D texture mapping on a UV-mapped GLB T shirt, with mobile direct manipulation as the primary acceptance test. No archive or advanced creative features until the core interaction and 3D loop are proven.

The spike is built and running in [`spikes/spike-01/`](spikes/spike-01/) — both candidate editors pass the spec with the live 2D → 3D loop proven; Konva is provisionally recommended pending the mobile hardware test (see the spike README and Decision Log D-002…D-004).

## Project structure

```
/app          Studio Shell — navigation, projects, identity, settings, workspace state
/visual-lab   2D composition, image treatment, typography, colour, texture, layers
/garment-lab  Live 3D garments, surfaces, UV mapping, cross-surface preview
/archive      Sources, notes, visual references, provenance and rights metadata
/materials    Extracted typography, palettes, textures, marks and RFML-created material
/collections  Groups of experiments, designs and potential releases
/production   Export, print preparation, warnings, labels, colour separation
/shared       Shared project and asset model
/3d-assets    Garment models (GLB) and related assets
/tests        Acceptance and interaction tests
/docs         Versioned product documentation
```

## Non-negotiable principles

- **Direct manipulation first** — see it, touch it, move it; panels are secondary.
- **2D and 3D share one design** — Object Mode is not a screenshot mockup.
- **Garment as object** — a T shirt is not two rectangles.
- **Provenance by default** — sources and extractions retain lineage; originals are never overwritten.
- **Visual DNA emerges** — Studio observes recurring characteristics, it does not impose a house style.
- **Warn, do not police** — flag risk or difficulty while preserving creative freedom.
- **Build the instrument before the intelligence** — interaction quality comes first.
