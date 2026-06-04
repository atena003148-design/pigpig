"""
Skill 1 – Production Blender render script
==========================================
Called by skill1_blender.py via:
  blender --background --python pipeline/render_skill1.py -- <mode> <glb> <output> [camera_json]

Arguments (after --):
  mode        : "static" or "animated"
  glb         : path to input GLB
  output      : output path (.png for static, .mp4 for animated)
  camera_json : (animated only) JSON string of camera keyframe list

Outputs:
  static   → front.png  (1080×1920, front-facing clay render)
  animated → gray_anim.mp4 (1080×1920 @ 30fps, multi-shot buzz camera)
"""

import bpy
import json
import math
import os
import sys

# ── Parse CLI args ────────────────────────────────────────────────────────────

def _args():
    argv = sys.argv
    try:
        rest = argv[argv.index("--") + 1:]
    except ValueError:
        rest = []
    mode   = rest[0] if len(rest) > 0 else "static"
    glb    = rest[1] if len(rest) > 1 else ""
    out    = rest[2] if len(rest) > 2 else ""
    kf_raw = rest[3] if len(rest) > 3 else "[]"
    return mode, glb, out, json.loads(kf_raw)

MODE, GLB_PATH, OUT_PATH, KEYFRAMES = _args()

# Grey-model render settings — quality intentionally low:
# vid2vid will re-stylize this, so shape/motion info is all that matters.
W, H   = 512, 910    # ~half-res 9:16; fast to render, enough for vid2vid
FPS    = 15          # 15fps is sufficient for motion capture by diffusion models

# ── Scene setup ───────────────────────────────────────────────────────────────

def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def load_glb(path):
    bpy.ops.import_scene.gltf(filepath=path)

def apply_clay_material():
    mat = bpy.data.materials.new("Clay")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    out_node  = nodes.new("ShaderNodeOutputMaterial")
    bsdf      = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value    = (0.82, 0.82, 0.82, 1.0)
    bsdf.inputs["Roughness"].default_value     = 0.55
    bsdf.inputs["Metallic"].default_value      = 0.0
    links.new(bsdf.outputs["BSDF"], out_node.inputs["Surface"])

    for obj in bpy.data.objects:
        if obj.type == "MESH":
            obj.data.materials.clear()
            obj.data.materials.append(mat)

def add_lighting():
    # Key light – warm sun
    key = bpy.data.lights.new("KeyLight", "AREA")
    key.energy = 800
    key.size   = 3.0
    key_obj = bpy.data.objects.new("KeyLight", key)
    bpy.context.scene.collection.objects.link(key_obj)
    key_obj.location       = (4.0, -3.0, 6.0)
    key_obj.rotation_euler = (math.radians(50), math.radians(20), math.radians(30))

    # Fill light – cool rim
    fill = bpy.data.lights.new("FillLight", "AREA")
    fill.energy = 300
    fill.size   = 5.0
    fill_obj = bpy.data.objects.new("FillLight", fill)
    bpy.context.scene.collection.objects.link(fill_obj)
    fill_obj.location       = (-5.0, 2.0, 3.0)
    fill_obj.rotation_euler = (math.radians(60), math.radians(-20), math.radians(-40))

    # Back rim – separation from background
    rim = bpy.data.lights.new("RimLight", "SPOT")
    rim.energy = 500
    rim.spot_size = math.radians(60)
    rim_obj = bpy.data.objects.new("RimLight", rim)
    bpy.context.scene.collection.objects.link(rim_obj)
    rim_obj.location       = (0.0, 5.0, 4.0)
    rim_obj.rotation_euler = (math.radians(-60), 0, 0)

def add_camera():
    cam_data = bpy.data.cameras.new("MainCam")
    cam_data.lens = 50  # standard focal length
    cam_obj = bpy.data.objects.new("MainCam", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj
    return cam_obj

def get_scene_center_and_radius():
    """Compute bounding sphere of all mesh objects."""
    verts = []
    for obj in bpy.data.objects:
        if obj.type == "MESH":
            for v in obj.data.vertices:
                verts.append(obj.matrix_world @ v.co)
    if not verts:
        return (0, 0, 0), 1.5
    xs = [v.x for v in verts]
    ys = [v.y for v in verts]
    zs = [v.z for v in verts]
    cx = (min(xs) + max(xs)) / 2
    cy = (min(ys) + max(ys)) / 2
    cz = (min(zs) + max(zs)) / 2
    r  = max(
        max(xs) - min(xs),
        max(ys) - min(ys),
        max(zs) - min(zs),
    ) / 2
    return (cx, cy, cz), max(r, 0.5)

def set_render_settings(mode):
    sc = bpy.context.scene
    sc.render.resolution_x = W
    sc.render.resolution_y = H
    sc.render.film_transparent = True

    # EEVEE with minimum TAA samples — fastest rasterisation path.
    # 1 sample means no AA on animation (acceptable for grey-model vid2vid input).
    sc.render.engine = "BLENDER_EEVEE"
    eevee = sc.eevee
    eevee.taa_render_samples  = 4 if mode == "static" else 1
    eevee.use_gtao             = True   # cheap AO gives depth cue
    eevee.use_bloom            = False
    eevee.use_ssr              = False

    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode  = "RGBA"

# ── Static render ─────────────────────────────────────────────────────────────

def render_static(glb_path, out_png):
    reset_scene()
    load_glb(glb_path)
    apply_clay_material()
    add_lighting()
    cam = add_camera()

    center, radius = get_scene_center_and_radius()
    dist = radius * 2.8
    # Front-facing: camera on -Y axis looking toward +Y
    cam.location = (center[0], center[1] - dist, center[2] + radius * 0.3)
    # Point camera at scene center
    direction = (
        center[0] - cam.location[0],
        center[1] - cam.location[1],
        center[2] - cam.location[2],
    )
    rot_x = math.atan2(
        math.sqrt(direction[0]**2 + direction[1]**2) * 0,
        -direction[2]
    )
    cam.rotation_euler = (math.radians(75), 0, 0)

    # World background – dark gradient
    bpy.context.scene.world = bpy.data.worlds.new("World")
    bpy.context.scene.world.use_nodes = True
    bg = bpy.context.scene.world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.03, 0.03, 0.05, 1.0)
    bg.inputs["Strength"].default_value = 0.1

    set_render_settings("static")
    sc = bpy.context.scene
    sc.render.filepath = out_png
    sc.frame_set(1)
    bpy.ops.render.render(write_still=True)
    print(f"[Skill1/static] → {out_png}")

# ── Animated render ───────────────────────────────────────────────────────────

# Built-in buzz camera shots — total ~44 s @ 30fps (1320 frames)
# For a quick test pass --shots-short to main() or set QUICK_TEST=True below.
QUICK_TEST = True    # set True to render only first 2 shots (~11 s) for speed checks

_DEFAULT_SHOTS = [
    # Shot 0 – Hook: extreme dutch-tilt close-up (3 s)
    {"preset": "dutch_tilt_close",  "start": 0,   "end": 90},
    # Shot 1 – Dramatic zoom-out reveal (8 s)
    {"preset": "zoomout",           "start": 90,  "end": 330},
    # Shot 2 – Low angle push-in (6 s)
    {"preset": "low_push",          "start": 330, "end": 510},
    # Shot 3 – 360° orbit (12 s)
    {"preset": "orbit_360",         "start": 510, "end": 870},
    # Shot 4 – Top-down crane down (5 s)
    {"preset": "crane_down",        "start": 870, "end": 1020},
    # Shot 5 – Fast whip-pan side (3 s)
    {"preset": "whip_pan",          "start": 1020,"end": 1110},
    # Shot 6 – Final dutch-tilt pull-back (7 s)
    {"preset": "dutch_tilt_out",    "start": 1110,"end": 1320},
]

_SHORT_SHOTS = [
    # 15fps: 3s=45f, 3s=45f → total 6s = 90 frames
    {"preset": "dutch_tilt_close", "start": 0,  "end": 45},
    {"preset": "zoomout",          "start": 45, "end": 90},
]


def _orbit_kf(center, radius, start, end, z_offset=0.3, tilt=0.0, start_angle=0):
    """Generate orbit keyframes around center."""
    steps = 8
    kfs = []
    for i in range(steps + 1):
        t = i / steps
        frame = int(start + t * (end - start))
        angle = start_angle + t * math.pi * 2
        d = radius * 2.5
        x = center[0] + d * math.sin(angle)
        y = center[1] - d * math.cos(angle)
        z = center[2] + radius * z_offset
        rot_x = math.radians(75) + tilt
        rot_z = angle + math.pi
        kfs.append({"frame": frame, "location": [x, y, z],
                     "rotation": [rot_x, tilt * 0.5, rot_z]})
    return kfs


def _build_shot_keyframes(shot, center, radius):
    preset = shot["preset"]
    s, e = shot["start"], shot["end"]
    d_near  = radius * 1.4
    d_mid   = radius * 2.8
    d_far   = radius * 6.5
    d_vfar  = radius * 9.0
    cx, cy, cz = center

    if preset == "dutch_tilt_close":
        return [
            {"frame": s, "location": [cx + d_near*0.6, cy - d_near*0.8, cz + radius*0.2],
             "rotation": [math.radians(80), math.radians(15), math.radians(10)]},
            {"frame": e, "location": [cx + d_near*0.4, cy - d_near,     cz + radius*0.4],
             "rotation": [math.radians(78), math.radians(12), math.radians(8)]},
        ]

    elif preset == "zoomout":
        return [
            {"frame": s, "location": [cx,       cy - d_near, cz + radius*0.5],
             "rotation": [math.radians(78), 0, 0]},
            {"frame": e, "location": [cx * 0.3, cy - d_vfar, cz + radius*1.2],
             "rotation": [math.radians(68), 0, 0]},
        ]

    elif preset == "low_push":
        return [
            {"frame": s, "location": [cx + radius*0.8, cy - d_far,  cz - radius*0.6],
             "rotation": [math.radians(92), 0, math.radians(-10)]},
            {"frame": e, "location": [cx + radius*0.2, cy - d_mid,  cz - radius*0.2],
             "rotation": [math.radians(95), 0, math.radians(-5)]},
        ]

    elif preset == "orbit_360":
        return _orbit_kf(center, radius, s, e, z_offset=0.5, tilt=0.0)

    elif preset == "crane_down":
        return [
            {"frame": s, "location": [cx, cy - d_mid,  cz + radius*3.5],
             "rotation": [math.radians(30), 0, 0]},
            {"frame": e, "location": [cx, cy - d_mid,  cz + radius*0.3],
             "rotation": [math.radians(80), 0, 0]},
        ]

    elif preset == "whip_pan":
        return [
            {"frame": s,   "location": [cx - d_mid, cy - d_mid * 0.3, cz + radius*0.5],
             "rotation": [math.radians(78), 0, math.radians(45)]},
            {"frame": s+5, "location": [cx - d_mid, cy - d_mid * 0.3, cz + radius*0.5],
             "rotation": [math.radians(78), 0, math.radians(45)]},
            {"frame": e-5, "location": [cx + d_mid, cy - d_mid * 0.3, cz + radius*0.5],
             "rotation": [math.radians(78), 0, math.radians(-45)]},
            {"frame": e,   "location": [cx + d_mid, cy - d_mid * 0.3, cz + radius*0.5],
             "rotation": [math.radians(78), 0, math.radians(-45)]},
        ]

    elif preset == "dutch_tilt_out":
        return [
            {"frame": s, "location": [cx + d_mid*0.5, cy - d_mid, cz + radius*0.6],
             "rotation": [math.radians(75), math.radians(-12), math.radians(20)]},
            {"frame": e, "location": [cx + d_far*0.7, cy - d_far, cz + radius*1.5],
             "rotation": [math.radians(65), math.radians(-8),  math.radians(15)]},
        ]

    return []  # unknown preset → no keyframes


def render_animated(glb_path, out_mp4, custom_keyframes=None):
    reset_scene()
    load_glb(glb_path)
    apply_clay_material()
    add_lighting()
    cam = add_camera()

    center, radius = get_scene_center_and_radius()

    # World
    bpy.context.scene.world = bpy.data.worlds.new("World")
    bpy.context.scene.world.use_nodes = True
    bg = bpy.context.scene.world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.02, 0.02, 0.04, 1.0)
    bg.inputs["Strength"].default_value = 0.05

    # Build keyframes from default shots or provided list
    if custom_keyframes:
        all_kf = custom_keyframes
    else:
        shots = _SHORT_SHOTS if QUICK_TEST else _DEFAULT_SHOTS
        all_kf = []
        for shot in shots:
            all_kf.extend(_build_shot_keyframes(shot, center, radius))

    # Sort by frame and insert
    all_kf.sort(key=lambda k: k["frame"])
    for kf in all_kf:
        cam.location = kf["location"]
        cam.rotation_euler = kf["rotation"]
        cam.keyframe_insert("location",       frame=kf["frame"])
        cam.keyframe_insert("rotation_euler", frame=kf["frame"])

    # Smooth interpolation → BEZIER for cinematic feel
    if cam.animation_data and cam.animation_data.action:
        for fcurve in cam.animation_data.action.fcurves:
            for kp in fcurve.keyframe_points:
                kp.interpolation = "BEZIER"
                kp.handle_left_type  = "AUTO_CLAMPED"
                kp.handle_right_type = "AUTO_CLAMPED"

    total_frames = max(kf["frame"] for kf in all_kf)

    set_render_settings("animated")
    sc = bpy.context.scene
    sc.frame_start = 0
    sc.frame_end   = total_frames
    sc.render.fps  = FPS
    sc.render.image_settings.file_format = "FFMPEG"
    sc.render.ffmpeg.format  = "MPEG4"
    sc.render.ffmpeg.codec   = "H264"
    sc.render.ffmpeg.constant_rate_factor = "HIGH"
    sc.render.ffmpeg.ffmpeg_preset        = "REALTIME"
    sc.render.filepath = out_mp4
    bpy.ops.render.render(animation=True)
    print(f"[Skill1/animated] → {out_mp4}  ({total_frames} frames @ {FPS}fps)")

# ── Entry point ───────────────────────────────────────────────────────────────

os.makedirs(os.path.dirname(OUT_PATH) if os.path.dirname(OUT_PATH) else ".", exist_ok=True)

if MODE == "static":
    render_static(GLB_PATH, OUT_PATH)
elif MODE == "animated":
    render_animated(GLB_PATH, OUT_PATH, KEYFRAMES if KEYFRAMES else None)
else:
    print(f"Unknown mode: {MODE}")
    sys.exit(1)
