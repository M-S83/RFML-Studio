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

## D-005 — Application shell: Vite SPA now, Next.js reconsidered when a backend arrives

**Date:** 2026-08-27
**Status:** Active

The plan names React with Next.js as the default shell candidate (§4). Phase 2
has no server side — persistence is client-local — so the app starts as a Vite
single-page application: faster to build against, nothing to deploy. When
authentication and remote storage arrive (Supabase candidate), revisit whether
the shell moves to Next.js or stays an SPA over an API.

## D-006 — Persistence: IndexedDB adapter behind the store API

**Date:** 2026-08-27
**Status:** Active

Phase 2 persistence is IndexedDB (projects, assets, meta counters) accessed
only through `app/src/engine/store.js`; `storage/local.js` is the single file
that knows the backend. Supabase (the plan's storage candidate) can replace
the adapter without touching the app. Assets are stored once by id and never
overwritten — provenance originals stay intact.

## D-007 — Phase 2 working answers to the §15 data model questions

**Date:** 2026-08-27
**Status:** Active — each answer can be superseded individually

1. A Design begins with a garment template reference (`tshirt-v1`) but its
   artwork lives on Surfaces, so re-targeting later stays possible.
2. Elements do not carry their own transformation history in V1; history
   lives in Version snapshots.
3. Cross-surface objects: not represented yet — one Element belongs to one
   Surface until unwrapped mode (V2).
4. Immutable in provenance: Source records (frozen at creation) and the
   Extraction→Source link (constructor rejects an extraction without one).
5. Failed experiments: deferred to the V2 experiment tree.
6. Rights states from day one: unknown, research_only, cleared, rfml_original.
7. Internal resolution: 640-unit surface space, resolution-independent
   transforms; production export multiplies out (export pipeline is Phase 6).
8. 3D garment assets belong to a global template library, not to projects.

## D-008 — Phase 3 Visual Lab scope decisions

**Date:** 2026-08-27
**Status:** Active

- A group is an element kind holding child elements; ungrouping bakes the
  group transform into the children. Layer stacks stay flat otherwise.
- Basic masks are geometric clip shapes (circle, rounded rect) on images;
  free-form and image-based masks are V2 territory.
- Crop regions are element-axis-aligned and stored in source-image pixels,
  composing across repeated crops; the original asset is never modified.
- Basic texture = generated grain/halftone elements using blend modes, not a
  material system — the §7 print-instability toolkit remains V2.
- Text editing is an in-place overlay; per-letter manipulation (brief §8)
  remains V2.
- Two-finger pan/zoom of the canvas itself (brief §5A) is still not
  implemented — the gesture layer targets the selected object; revisit with
  the mobile hardware test.

## D-009 — Phase 4 Garment Lab: separate print surfaces on the procedural tee

**Date:** 2026-08-27
**Status:** Active

Rather than waiting for the commissioned GLB (§16), the procedural tee gained
the architecture the GLB will need: a plain body mesh carrying the garment
colour, plus one flat silhouette "print surface" per garment side with its
own live texture. Front and back are therefore independent (no mirroring),
and swapping in the real GLB later only replaces geometry — the per-surface
texture pipeline stays. Consequences accepted for V1: prints are flat planes
floating just off the body (no drape), and sleeves receive artwork as part of
the silhouette rather than as separate surfaces. The design card thumbnail
tracks the front surface only.

## D-010 — (next decision)

**Date:**
**Status:**

<!-- Template:
## D-NNN — Short title

**Date:** YYYY-MM-DD
**Status:** Active | Superseded by D-NNN

Context, alternatives considered, and reason for the choice.
-->
