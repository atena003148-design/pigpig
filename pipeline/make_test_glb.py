"""
Blender script: generate a test GLB with a product-like mesh
(sphere on a pedestal) and export as input.glb.

Run via:
  blender --background --python pipeline/make_test_glb.py -- output/input.glb
"""

import bpy
import sys
import os

# ── Parse output path from argv ──────────────────────────────────────────────
argv = sys.argv
try:
    out_path = argv[argv.index("--") + 1]
except (ValueError, IndexError):
    out_path = "/home/user/pigpig/pipeline/output/input.glb"

os.makedirs(os.path.dirname(out_path), exist_ok=True)

# ── Clean scene ───────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)

# ── Pedestal (cylinder) ───────────────────────────────────────────────────────
bpy.ops.mesh.primitive_cylinder_add(
    radius=1.2, depth=0.2, location=(0, 0, -0.1)
)
pedestal = bpy.context.active_object
pedestal.name = "Pedestal"

# ── Main body (UV sphere) ─────────────────────────────────────────────────────
bpy.ops.mesh.primitive_uv_sphere_add(
    radius=0.9, location=(0, 0, 0.9), segments=64, ring_count=32
)
body = bpy.context.active_object
body.name = "Body"

# ── Detail rings (torus) ──────────────────────────────────────────────────────
bpy.ops.mesh.primitive_torus_add(
    major_radius=0.95, minor_radius=0.08,
    location=(0, 0, 0.9),
    major_segments=64, minor_segments=16,
)
ring = bpy.context.active_object
ring.name = "Ring"

# ── Top cap (cone) ────────────────────────────────────────────────────────────
bpy.ops.mesh.primitive_cone_add(
    radius1=0.35, radius2=0.05, depth=0.4,
    location=(0, 0, 1.95),
    vertices=32,
)
cap = bpy.context.active_object
cap.name = "Cap"

# ── Single grey PBR material on all meshes ────────────────────────────────────
mat = bpy.data.materials.new("ProductGrey")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value = (0.72, 0.72, 0.72, 1.0)
bsdf.inputs["Metallic"].default_value = 0.4
bsdf.inputs["Roughness"].default_value = 0.3

for obj in [pedestal, body, ring, cap]:
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)

# ── Export GLB ────────────────────────────────────────────────────────────────
bpy.ops.export_scene.gltf(
    filepath=out_path,
    export_format="GLB",
    export_materials="EXPORT",
)
print(f"[make_test_glb] Exported → {out_path}")
