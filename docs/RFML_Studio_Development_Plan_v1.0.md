# RFML Studio Development Plan

**Version:** v1.0  
**Date:** 27 August 2026  
**Status:** Working development roadmap  
**Companion document:** RFML Studio Master Functional Brief v1.2

> This plan turns the Studio vision into an executable product programme. It does not redefine RFML's visual language. It defines how the software capable of discovering, preserving and producing that language should be built.

## 1. Product Goal

Build RFML Studio as a creative research, design and production environment in which 2D artwork, live 3D garments, research provenance, extracted visual material, experiments and production outputs remain connected.

The first milestone is not “build every Studio feature”.

The first milestone is to prove the core creative engine:

RESEARCH MATERIAL → 2D ARTWORK → LIVE 3D GARMENT → SAVE → REOPEN → CONTINUE

If that loop feels natural, the remaining Studio systems can be built around it.

## 2. Non Negotiable Product Principles

### Direct manipulation first

The canvas must feel physical. See it, touch it, move it. Property panels support direct manipulation rather than replacing it.

### 2D and 3D share one design

Object Mode is not a screenshot mockup. 2D and 3D are representations of the same project data.

### Garment as object

A T shirt is not two rectangles. The architecture must support connected surfaces and later continuous artwork across seams.

### Provenance by default

Research sources and extracted elements retain lineage. The original source is never overwritten.

### Visual DNA emerges

Studio observes recurring characteristics. It does not impose a house style.

### Warn, do not police

Production and rights systems should flag risk or difficulty while preserving creative freedom.

### Build the instrument before the intelligence

A beautiful archive or AI extraction engine is of limited value if basic designing is frustrating. Interaction quality comes first.

## 3. Product Architecture

Studio should be developed as connected modules sharing one project and asset model.

### Studio Shell
Navigation, projects, identity, users, settings and workspace state.

### Visual Lab
2D composition, image treatment, typography, colour, texture, layers and experimentation.

### Garment Lab
Live 3D T shirt, garment surfaces, UV mapping, cross surface preview and later material behaviour.

### Research Archive
Sources, notes, visual references, provenance and rights metadata.

### Material Library
Extracted typography, palettes, textures, marks, imagery and reusable RFML created material.

### Archive Wall
Freeform visual exploration of sources, elements and relationships.

### Visual DNA
Pattern discovery across research and RFML work. Observational, not prescriptive.

### Collections
Groups of experiments, designs and potential releases.

### Production
Export, print preparation, production warnings, labels, colour separation and manufacturing information.

## 4. Technical Direction to Prototype

Do not commit to the final stack until the interaction spike is complete.

### Application layer
React with Next.js is the default candidate for the web application shell.

### 2D editor candidates
Test:
• Konva / react-konva
• Fabric.js
• Polotno SDK

The decisive question is which foundation gives RFML the best direct manipulation, touch interaction, object model, export path and ability to integrate with 3D.

### 3D
Three.js with React Three Fiber is the primary candidate.

Garments should use GLTF / GLB assets with controlled UV mapping.

### Data and storage
Supabase is a strong starting candidate for PostgreSQL, authentication, file storage, relational provenance and search metadata.

### Image processing
Use browser capable processing for immediate editing where practical. Add server side or Python based processing for heavier extraction and analysis later. Potential tools include Sharp, OpenCV and GPU shaders.

### Source control and deployment
GitHub for source control. Vercel is a practical starting deployment option for a Next.js application, subject to final architecture.

## 5. Phase 0 — Product Definition

**Goal:** remove ambiguity before coding the production application.

Deliverables:
• Master Functional Brief v1.2
• Development Plan v1.0
• Studio module map
• V1 user journey
• Data object definitions
• Acceptance tests
• Technology spike brief
• First T shirt 3D asset specification

Decisions required:
• Web first versus desktop wrapper later
• Target mobile browsers for V1
• First garment specification
• Export resolution requirements
• Whether Polotno licensing is acceptable before it enters the technical comparison

Exit condition:
The team can explain exactly what V1 is and what it deliberately does not include.

## 6. Phase 1 — Interaction and Technology Spike

**Goal:** choose the canvas and 3D foundations through working prototypes.

Build the same small prototype with each serious 2D candidate.

Prototype contains:
• One T shirt project
• Five overlapping objects
• Text
• Image
• Thin line or frame
• Touch selection
• Drag
• Pinch scale
• Rotate
• Reorder
• Lock
• Duplicate
• Undo / redo
• Save object state

Mobile test:
1. Add five objects.
2. Move them into a composition.
3. Put one behind another.
4. Select the object underneath.
5. Resize it.
6. Rotate it.
7. Duplicate it.
8. Move the duplicate.
9. Lock a background.
10. Rearrange the composition.

A new user should be able to complete this without instructions.

3D spike:
• Load one UV mapped GLB T shirt
• Render it interactively
• Orbit and zoom
• Apply one canvas generated texture
• Update the texture when 2D artwork changes

Critical proof:
Move a graphic in 2D and see it update on the 3D T shirt without re exporting or manually refreshing the design.

Exit condition:
Choose the 2D foundation and prove 2D ↔ 3D live mapping.

## 7. Phase 2 — Core Project Engine

**Goal:** create the persistent model underneath Studio.

Define core objects:

PROJECT  
DESIGN  
VERSION  
SURFACE  
LAYER  
ELEMENT  
SOURCE  
EXTRACTION  
EXPERIMENT  
COLLECTION  
PRODUCTION OUTPUT

Every object receives a stable ID.

Minimum relationships:
• Design belongs to Project
• Version belongs to Design
• Layer belongs to Version
• Source can connect to Design, Element or Extraction
• Extraction always connects back to Source
• Element can be Source Material, RFML Created or RFML Transformed
• Production Output connects to an approved Version

Implement:
• Create project
• Save project
• Autosave
• Reopen project
• Version snapshot
• Duplicate design
• Basic asset storage
• Provenance link

Exit condition:
A design can be closed, reopened and continue exactly where it was left.

## 8. Phase 3 — V1 Visual Lab

**Goal:** make Studio genuinely useful for designing.

Implement:
• Free object placement
• Robust layer selection
• Transform gestures
• Grouping
• Stacking
• Visibility
• Locking
• Crop
• Opacity
• Basic masks
• Image upload
• Text
• Font selection
• Tracking
• Leading
• Rotation
• Outline
• Shadow
• Colour
• Basic texture
• Undo and redo
• Copy / paste
• Duplication

Mobile workspace:
• Canvas dominant Create state
• Collapsible Edit controls
• Forgiving touch targets
• Simplified render during expensive drag operations where required

Exit condition:
Creating a back print composition feels faster and easier than the Brik prototype that prompted this requirement.

## 9. Phase 4 — V1 Garment Lab

**Goal:** make 3D a genuine part of the design process.

First supported object:
T shirt.

Implement:
• Live 3D viewer
• Orbit
• Zoom
• Reset view
• Front / back quick views
• Shared texture generation from Studio artwork
• Front and back mapping
• Initial sleeve support where model permits
• Project linked garment colour
• Artwork scale accuracy
• High quality preview capture

Architecture must prepare for:
• Unwrapped surface editing
• Cross seam artwork
• Additional garment types
• Fabric and print material simulation

V1 acceptance test:
Create artwork in 2D, rotate the T shirt and inspect the result without leaving the project or exporting to another tool.

## 10. Phase 5 — Archive Foundation

**Goal:** connect creative work to research without slowing down designing.

Implement:
• Source upload
• Source metadata
• Date discovered
• Research context
• Notes
• Rights status
• Link source to project
• Source / created / transformed classification
• Simple visual archive
• Manual tags
• Search

Basic extraction for V1:
• Colour palette
• Image crop / isolated region
• Saved texture sample
• Saved typography reference image

Human approval remains mandatory before permanent archive entry.

Exit condition:
A designer can answer “where did this element come from?” from inside the project.

## 11. Phase 6 — V1 Export and Recovery

**Goal:** trust the tool with real work.

Implement:
• PNG
• JPG
• PDF presentation export
• Transparent high resolution artwork
• Per surface export
• Project package / archive export where practical
• Autosave recovery
• Explicit version snapshots

Test:
• Browser refresh during work
• Interrupted upload
• Failed render
• Large image
• Phone rotation
• Project reopened on another device

Exit condition:
The user is comfortable doing serious work in Studio without fearing loss of the design.

## 12. V1 Definition of Done

V1 is complete when:
• A project can be created and assigned an ID.
• Research images can be attached.
• Artwork can be composed naturally on desktop and phone.
• Objects can be selected even when overlapping.
• Layers can be locked, reordered, hidden, grouped and duplicated.
• Images and typography can be manipulated.
• The design updates on a live rotatable 3D T shirt.
• The project saves and reopens correctly.
• Source provenance remains attached.
• A usable production quality artwork export can be produced.
• No template or style system forces the work to look “RFML”.

## 13. V2 Programme

Once the core loop is stable, add:
• Left and right sleeve surfaces
• Collar, neck and hem
• Unwrapped garment mode
• Continuous artwork across surfaces
• Experiment branching and family tree
• Advanced typography manipulation
• Halftone and print instability tools
• Registration offset
• Grain and photocopy treatment
• Physical Composition Table
• Deeper visual archive
• Composition extraction
• Design DNA panel
• Presentation builder
• Production warnings
• Rights propagation

## 14. V3 Programme

Later work can include:
• Advanced cloth and drape simulation
• Material specific rendering
• Embroidery depth
• Ink and print material simulation
• Additional garment types
• Packaging and physical object templates
• Colour separation
• Supplier and manufacturing preparation
• Advanced Visual DNA clustering
• Natural language visual search
• Deeper AI extraction
• Collaboration
• Collection and release management

## 15. Data Model Questions for the Build Chat

Resolve these early:
1. Is a Design independent of garment type, or does a Design begin with a product?
2. Should an Element contain its own transformation history?
3. How are cross surface objects represented before unwrapped mode exists?
4. What is immutable in provenance?
5. How should failed experiments be stored without cluttering the active workspace?
6. Which rights states are needed from day one?
7. What resolution should Studio use internally for production safe output?
8. Do 3D garment assets belong to projects or a global template library?

## 16. First 3D Asset Specification

Commission or create one clean T shirt GLB for the technology spike.

Requirements:
• Sensible topology
• Separate material zones where useful
• Reliable UV layout
• Predictable front and back UV areas
• Sleeves included
• Collar included
• Neutral base material
• No baked branding
• Correct normals
• Reasonable polygon count for mobile
• Tested on current mobile browsers

The purpose of the first model is technical truth, not fashion presentation.

## 17. Quality and Performance Targets

Studio must prioritise perceived responsiveness.

Targets to validate:
• Selection feels immediate
• Dragging tracks the finger smoothly
• Pinch and rotation do not jump
• 3D orbit remains responsive on a modern phone
• Save feedback is clear
• No unexpected object movement when navigating the canvas
• Expensive effects can degrade gracefully during interaction

Formal performance budgets can be set after the first technical spike.

## 18. Suggested Project Structure

RFML Studio
• /app
• /visual-lab
• /garment-lab
• /archive
• /materials
• /collections
• /production
• /shared
• /3d-assets
• /tests
• /docs

Keep product documentation versioned with the codebase.

## 19. Build Governance

Maintain three documents throughout development:

**Master Functional Brief**  
What Studio ultimately needs to become.

**Development Plan**  
The current sequence for getting there.

**Decision Log**  
Why major technical and product decisions were made.

Do not rewrite old decisions out of history. Record superseded decisions and the reason for change.

## 20. What We Should Do in the New Chat

Start the next chat as the **RFML Studio Build Chat**.

The first task should not be writing the full application.

Begin with:

**Technology Spike 01 — Direct Manipulation + Live 3D T Shirt**

Build or compare the smallest possible prototypes that prove:
• Natural touch manipulation
• Reliable layer object model
• Live 2D to 3D texture update
• Mobile performance

The output of that spike should be a technical decision, not a polished application.

Only after that decision should the production Studio repository and V1 engine be started.

## 21. First Build Prompt

Use this as the opening objective in the new chat:

“Build RFML Studio from the Master Functional Brief v1.2 and Development Plan v1.0. Start with Technology Spike 01. We need to choose the 2D canvas foundation and prove live 2D to 3D T shirt mapping before building the production app. Mobile direct manipulation is the primary acceptance test. Do not add archive or advanced creative features until the core interaction and 3D loop are proven.”

## 22. Success

The Studio programme is succeeding when the software disappears from the user's attention.

The user should be thinking about typography, image, composition, print, garments, research and ideas rather than how to operate the editor.

The foundational loop is:

DISCOVER → ARRANGE → SEE IN 3D → ITERATE → TRACE → PRODUCE → ARCHIVE

Everything else should strengthen that loop.
