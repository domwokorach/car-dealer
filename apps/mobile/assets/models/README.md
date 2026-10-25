# 3D models

Vehicle models are **not bundled with the app**. They are uploaded by dealers (dealer portal → Inventory → *3D model*),
stored in the private `vehicle-models` Supabase bucket and downloaded on demand when a customer opens the 360° view.
Do not commit `.glb` files here.

## Test model

For development and testing use the Khronos **CarConcept** sample (a concept car, *not* a real listed vehicle — never
upload it against a real stock vehicle):

- Source: https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept
- File: `glTF-Binary/CarConcept.glb` (~11 MB, ~213k triangles, 14 textures)
- Licence: © 2024 Darmstadt Graphics Group GmbH, **CC BY 4.0**; model and textures by Eric Chadwick. Credit is required if shown publicly.

## What a valid model looks like (enforced by the API on upload)

Binary glTF 2.0 · y-up, car facing +z · ≤ 40 MB · ≤ 500,000 triangles · ≤ 24 textures, each ≤ 4096 px · ≤ 64 materials ·
everything embedded (no external files) · no Draco / Meshopt / KTX2 / WebP-texture compression (neither renderer can decode them).
Aim for under ~15 MB and ~150k triangles for smooth phones.
