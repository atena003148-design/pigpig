"""
Skill 1 – 空間の提示と骨組み撮影 (Blender)

Renders a GLB file either as a still PNG (for Vision analysis)
or as an animated grey-shaded MP4 (for Vid2Vid texturing).
"""

import json
import os
import subprocess
import tempfile
import textwrap
import time
from dataclasses import dataclass, field
from typing import Literal

from pipeline.config import BLENDER_BIN, OUTPUT_DIR, RENDER_FPS, RENDER_HEIGHT, RENDER_WIDTH


@dataclass
class CameraParams:
    """Describes one camera shot for animated mode."""
    start_frame: int = 0
    end_frame: int = 90           # 3 s @ 30 fps
    # Camera path: list of (frame, location_xyz, rotation_euler_xyz) keyframes
    keyframes: list[dict] = field(default_factory=list)
    # Convenience presets override keyframes when set
    preset: Literal["orbit", "zoomout", "pan_up", "dutch_tilt", ""] = ""


# ── Preset keyframe builders ──────────────────────────────────────────────────

def _preset_orbit(start: int, end: int) -> list[dict]:
    """360° orbit around the object – classic product-reveal move."""
    mid = (start + end) // 2
    return [
        {"frame": start, "location": [4, 0, 1.5], "rotation": [1.2, 0, 0]},
        {"frame": mid,   "location": [0, 4, 1.5], "rotation": [1.2, 0, 1.57]},
        {"frame": end,   "location": [-4, 0, 1.5], "rotation": [1.2, 0, 3.14]},
    ]


def _preset_zoomout(start: int, end: int) -> list[dict]:
    """Dramatic pull-back that reveals the whole structure."""
    return [
        {"frame": start, "location": [1.0, -1.0, 0.5], "rotation": [1.4, 0, 0]},
        {"frame": end,   "location": [6.0, -6.0, 3.0], "rotation": [1.1, 0, 0]},
    ]


def _preset_pan_up(start: int, end: int) -> list[dict]:
    """Low-angle upward pan – makes objects feel monumental."""
    return [
        {"frame": start, "location": [3, -3, -1], "rotation": [1.6, 0, 0.3]},
        {"frame": end,   "location": [3, -3,  3], "rotation": [1.0, 0, 0.3]},
    ]


def _preset_dutch_tilt(start: int, end: int) -> list[dict]:
    """Dutch-angle + slight push-in for edgy feel."""
    return [
        {"frame": start, "location": [3, -4, 1], "rotation": [1.2, 0.3, 0.4]},
        {"frame": end,   "location": [2, -3, 1], "rotation": [1.2, 0.3, 0.4]},
    ]


_PRESETS = {
    "orbit":       _preset_orbit,
    "zoomout":     _preset_zoomout,
    "pan_up":      _preset_pan_up,
    "dutch_tilt":  _preset_dutch_tilt,
}


# ── Blender Python script builders ───────────────────────────────────────────

def _build_static_script(glb_path: str, output_png: str) -> str:
    return textwrap.dedent(f"""
        import bpy, math

        bpy.ops.wm.read_factory_settings(use_empty=True)
        bpy.ops.import_scene.gltf(filepath={repr(glb_path)})

        # Grey clay material on all mesh objects
        mat = bpy.data.materials.new("Clay")
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes["Principled BSDF"]
        bsdf.inputs["Base Color"].default_value = (0.8, 0.8, 0.8, 1)
        for obj in bpy.data.objects:
            if obj.type == "MESH":
                obj.data.materials.clear()
                obj.data.materials.append(mat)

        # Camera facing front
        cam_data = bpy.data.cameras.new("Cam")
        cam = bpy.data.objects.new("Cam", cam_data)
        bpy.context.scene.collection.objects.link(cam)
        bpy.context.scene.camera = cam
        cam.location = (0, -5, 1)
        cam.rotation_euler = (1.3, 0, 0)

        # Lighting
        light_data = bpy.data.lights.new("Sun", "SUN")
        light = bpy.data.objects.new("Sun", light_data)
        bpy.context.scene.collection.objects.link(light)
        light.location = (5, -5, 8)

        # Render settings
        sc = bpy.context.scene
        sc.render.resolution_x = {RENDER_WIDTH}
        sc.render.resolution_y = {RENDER_HEIGHT}
        sc.render.image_settings.file_format = "PNG"
        sc.render.filepath = {repr(output_png)}
        bpy.ops.render.render(write_still=True)
    """)


def _build_animated_script(glb_path: str, output_mp4: str, shots: list[CameraParams]) -> str:
    # Flatten all shots into a single timeline
    keyframe_data = json.dumps(
        [kf for shot in shots for kf in shot.keyframes]
    )
    total_frames = max(s.end_frame for s in shots)

    return textwrap.dedent(f"""
        import bpy, json, math

        bpy.ops.wm.read_factory_settings(use_empty=True)
        bpy.ops.import_scene.gltf(filepath={repr(glb_path)})

        mat = bpy.data.materials.new("Clay")
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes["Principled BSDF"]
        bsdf.inputs["Base Color"].default_value = (0.8, 0.8, 0.8, 1)
        for obj in bpy.data.objects:
            if obj.type == "MESH":
                obj.data.materials.clear()
                obj.data.materials.append(mat)

        cam_data = bpy.data.cameras.new("Cam")
        cam = bpy.data.objects.new("Cam", cam_data)
        bpy.context.scene.collection.objects.link(cam)
        bpy.context.scene.camera = cam

        light_data = bpy.data.lights.new("Sun", "SUN")
        light = bpy.data.objects.new("Sun", light_data)
        bpy.context.scene.collection.objects.link(light)
        light.location = (5, -5, 8)

        keyframes = json.loads({repr(keyframe_data)})
        for kf in keyframes:
            cam.location = kf["location"]
            cam.rotation_euler = kf["rotation"]
            cam.keyframe_insert("location",        frame=kf["frame"])
            cam.keyframe_insert("rotation_euler",  frame=kf["frame"])

        sc = bpy.context.scene
        sc.frame_start = 0
        sc.frame_end   = {total_frames}
        sc.render.fps  = {RENDER_FPS}
        sc.render.resolution_x = {RENDER_WIDTH}
        sc.render.resolution_y = {RENDER_HEIGHT}
        sc.render.image_settings.file_format = "FFMPEG"
        sc.render.ffmpeg.format = "MPEG4"
        sc.render.ffmpeg.codec  = "H264"
        sc.render.filepath = {repr(output_mp4)}
        bpy.ops.render.render(animation=True)
    """)


# ── Public API ────────────────────────────────────────────────────────────────

def render_static(glb_path: str, output_png: str | None = None) -> str:
    """
    [MOCK] Skips Blender. Creates a minimal 1x1 white PNG as a stand-in.
    """
    import struct, zlib
    if output_png is None:
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        output_png = os.path.join(OUTPUT_DIR, "static_preview.png")

    time.sleep(1)  # simulate render time

    # Write a valid 1×1 white PNG without Pillow
    def _make_png() -> bytes:
        def chunk(name: bytes, data: bytes) -> bytes:
            c = name + data
            return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)
        ihdr = struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0)
        raw = b"\x00\xff\xff\xff"  # filter byte + RGB white
        idat = zlib.compress(raw)
        return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")

    with open(output_png, "wb") as f:
        f.write(_make_png())

    import logging
    logging.getLogger(__name__).info("[MOCK] Skill 1 static → %s", output_png)
    return output_png


def render_animated(
    glb_path: str,
    shots: list[CameraParams],
    output_mp4: str | None = None,
) -> str:
    """
    [MOCK] Skips Blender. Creates a minimal valid MP4 (black 1-second clip).
    """
    if output_mp4 is None:
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        output_mp4 = os.path.join(OUTPUT_DIR, "grey_model.mp4")

    time.sleep(2)  # simulate render time

    _write_dummy_mp4(output_mp4)

    import logging
    logging.getLogger(__name__).info("[MOCK] Skill 1 animated → %s", output_mp4)
    return output_mp4


def _write_dummy_mp4(path: str) -> None:
    """Create a 2-second black 1080×1920 MP4 using FFmpeg if available, else write empty file."""
    try:
        result = subprocess.run(
            [
                "ffmpeg", "-y",
                "-f", "lavfi", "-i", "color=c=black:s=1080x1920:r=30:d=2",
                "-f", "lavfi", "-i", "aevalsrc=0:r=44100:d=2",
                "-c:v", "libx264", "-preset", "ultrafast", "-crf", "40",
                "-c:a", "aac", "-b:a", "64k",
                path,
            ],
            capture_output=True,
            timeout=30,
        )
        if result.returncode == 0:
            return
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass
    # Fallback: empty file (pipeline won't crash on path checks)
    open(path, "wb").close()


def _run_blender(script: str) -> None:
    with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False) as f:
        f.write(script)
        script_path = f.name

    cmd = [BLENDER_BIN, "--background", "--python", script_path]
    result = subprocess.run(cmd, capture_output=True, text=True)
    os.unlink(script_path)

    if result.returncode != 0:
        raise RuntimeError(
            f"Blender failed (exit {result.returncode}):\n{result.stderr[-2000:]}"
        )
