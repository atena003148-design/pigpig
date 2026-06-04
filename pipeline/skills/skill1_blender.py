"""
Skill 1 – 空間の提示と骨組み撮影 (Blender)

Production implementation.
Renders a GLB file via Blender headless (EEVEE, 512×910, 15fps) into:
  - static PNG  : front-facing clay render for Vision analysis
  - animated MP4: buzz-camera grey-model for Vid2Vid texturing

Environment requirements:
  - blender 4.x in PATH  (apt install blender)
  - Xvfb for EEVEE headless  (apt install xvfb)
  - pipeline/render_skill1.py  (the bpy render script)
"""

import json
import logging
import os
import shutil
import subprocess
import tempfile
import time
from dataclasses import dataclass, field
from typing import Literal

from pipeline.config import BLENDER_BIN, OUTPUT_DIR

log = logging.getLogger(__name__)

# Path to the bpy render script (sibling of this package)
_RENDER_SCRIPT = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "render_skill1.py"
)


@dataclass
class CameraParams:
    """Describes one camera shot for animated mode."""
    start_frame: int = 0
    end_frame: int = 45            # 3 s @ 15 fps
    keyframes: list[dict] = field(default_factory=list)
    preset: Literal["orbit", "zoomout", "pan_up", "dutch_tilt", ""] = ""


# ── Public API ────────────────────────────────────────────────────────────────

def render_static(glb_path: str, output_png: str | None = None) -> str:
    """
    Render a front-facing clay PNG of the GLB for Vision analysis.
    Returns the path to the output PNG.
    """
    if output_png is None:
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        output_png = os.path.join(OUTPUT_DIR, "front.png")

    _run_blender_render("static", glb_path, output_png)
    log.info("Skill 1 static → %s", output_png)
    return output_png


def render_animated(
    glb_path: str,
    shots: list[CameraParams] | None = None,
    output_mp4: str | None = None,
) -> str:
    """
    Render the grey-model animation as MP4.
    `shots` is optional; if omitted the default buzz-camera shots are used.
    Returns the path to the output MP4.
    """
    if output_mp4 is None:
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        output_mp4 = os.path.join(OUTPUT_DIR, "gray_anim.mp4")

    # Convert CameraParams → keyframe JSON if provided
    kf_json = "[]"
    if shots:
        kf_json = _shots_to_keyframe_json(shots)

    _run_blender_render("animated", glb_path, output_mp4, kf_json)
    log.info("Skill 1 animated → %s", output_mp4)
    return output_mp4


# ── Internal helpers ──────────────────────────────────────────────────────────

def _run_blender_render(mode: str, glb: str, out: str, kf_json: str = "[]") -> None:
    """
    Invoke Blender headless with render_skill1.py.
    Starts Xvfb automatically if EEVEE requires a display.
    """
    xvfb_proc = None
    env = os.environ.copy()

    if not env.get("DISPLAY"):
        xvfb_proc, display = _start_xvfb()
        env["DISPLAY"] = display

    cmd = [
        BLENDER_BIN, "--background",
        "--python", _RENDER_SCRIPT,
        "--", mode, glb, out, kf_json,
    ]

    try:
        t0 = time.time()
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            env=env,
        )
        elapsed = time.time() - t0

        if result.returncode != 0:
            raise RuntimeError(
                f"Blender failed (exit {result.returncode}):\n"
                f"{result.stderr[-3000:]}"
            )

        log.info("Blender render done in %.1fs", elapsed)

    finally:
        if xvfb_proc:
            xvfb_proc.terminate()


def _start_xvfb() -> tuple[subprocess.Popen, str]:
    """Start a virtual framebuffer for EEVEE and return (process, DISPLAY)."""
    display = ":99"
    proc = subprocess.Popen(
        ["Xvfb", display, "-screen", "0", "1280x720x24"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    time.sleep(1.0)  # give Xvfb time to initialise
    log.debug("Xvfb started on %s (pid %d)", display, proc.pid)
    return proc, display


def _shots_to_keyframe_json(shots: list[CameraParams]) -> str:
    """Flatten CameraParams list into the JSON format expected by render_skill1.py."""
    all_kf = []
    for shot in shots:
        all_kf.extend(shot.keyframes)
    return json.dumps(all_kf)
