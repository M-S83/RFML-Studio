# RFML Studio Decision Log

Why major technical and product decisions were made.

Rules for this log (from Development Plan v1.0, §19 Build Governance):

- Record the decision, the date, the alternatives considered and the reason.
- Do not rewrite old decisions out of history — record superseded decisions and the reason for the change.

---

## D-001 — Repository created before Technology Spike 01

**Date:** 2026-08-27
**Status:** Active

The Development Plan (§20) states the production Studio repository should be started only after the technology spike decision. This repository was created early to version the governing documents and host the spike prototypes themselves, per §18 ("Keep product documentation versioned with the codebase"). No production application code exists yet; the directory skeleton is a placeholder for the module map, not a stack commitment.

## D-002 — Polotno excluded from Spike 01 pending licensing decision

**Date:** 2026-08-27
**Status:** Active

The Development Plan (§5) requires deciding whether Polotno SDK's commercial
licensing is acceptable before it enters the technical comparison. Spike 01
therefore compares Konva/react-konva and Fabric.js only. If the licensing is
accepted, Polotno joins as a third route implementing the same spec; if not,
this decision closes the question.

## D-003 — Procedural T shirt as spike placeholder for the commissioned GLB

**Date:** 2026-08-27
**Status:** Active

Spike 01 uses a procedurally generated low-poly tee (extruded silhouette,
bounding-box UVs) instead of the §16 commissioned GLB, so the 2D ↔ 3D loop
could be proven without waiting on an asset. Consequence: the back cap mirrors
the front artwork. The commissioned GLB with separate front/back UV islands
supersedes the placeholder before Phase 4.

## D-004 — 2D canvas foundation: provisionally Konva / react-konva

**Date:** 2026-08-27
**Status:** Provisional — becomes final only after the mobile hardware test

Both candidates passed the full Spike 01 spec with the live 2D → 3D loop
working. Konva is provisionally preferred because (a) its layer separation
gives a zero-copy live-texture path with selection UI never printed onto the
garment, and (b) react-konva lets the project's own data model (the future
Phase 2 objects) drive the canvas as the single source of truth, matching
"2D and 3D share one design". Fabric's in-place text editing is the pattern
to port. Full findings: spikes/spike-01/README.md.

## D-005 — (next decision)

**Date:**
**Status:**

<!-- Template:
## D-NNN — Short title

**Date:** YYYY-MM-DD
**Status:** Active | Superseded by D-NNN

Context, alternatives considered, and reason for the choice.
-->
