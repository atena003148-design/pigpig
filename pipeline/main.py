"""
GLB → Viral Short Video Pipeline
─────────────────────────────────
Agentic orchestrator: an LLM Director autonomously decides camera shots,
visual style, and mood, then calls each Skill in sequence.

Usage:
    python -m pipeline.main path/to/model.glb [--output out.mp4]
"""

import argparse
import json
import logging
import os
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from pipeline.config import OUTPUT_DIR, RENDER_FPS
from pipeline.skills.skill1_blender import CameraParams, render_animated, render_static
from pipeline.skills.skill2_vision import analyse_and_blueprint
from pipeline.skills.skill3_vid2vid import apply_texture
from pipeline.skills.skill4_audio import generate_audio
from pipeline.skills.skill5_edit import compose_final_video

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

# ── Director system prompt ────────────────────────────────────────────────────

_DIRECTOR_SYSTEM = """\
You are a viral short-video AI Director. You receive a JSON blueprint from a
Vision analysis step and must decide the final execution plan:
- Confirm or adjust the camera_shots to ensure the total is ≤58 s.
- Choose a mood for the audio that matches the visual_prompt.
- Return ONLY a JSON object with keys: "camera_shots", "mood".
  camera_shots is the (possibly adjusted) array from the blueprint.
  mood is a single descriptive string (e.g. "cinematic epic", "lo-fi chill").
"""

_DIRECTOR_USER = """\
Blueprint:
{blueprint}

Evaluate and return the execution plan JSON.
"""

# ── Pipeline state ─────────────────────────────────────────────────────────────

@dataclass
class PipelineState:
    glb_path: str
    static_png: str = ""
    blueprint: dict = None        # from Skill 2
    execution_plan: dict = None   # from Director LLM
    grey_video: str = ""
    textured_video: str = ""
    audio: str = ""
    final_video: str = ""


# ── Director agent ─────────────────────────────────────────────────────────────

def director_plan(blueprint: dict) -> dict:
    """
    [MOCK] Returns the blueprint's camera_shots and mood directly without calling OpenAI.
    In production this calls GPT-4o to validate and adjust the plan.
    """
    log.info("Director: [MOCK] validating blueprint locally …")
    time.sleep(1)  # simulate LLM latency
    plan = {
        "camera_shots": blueprint["camera_shots"],
        "mood": blueprint.get("mood", "cinematic epic"),
    }
    log.info("Director plan: mood=%s, shots=%d", plan["mood"], len(plan["camera_shots"]))
    return plan


# ── Shot helpers ───────────────────────────────────────────────────────────────

def _shots_to_camera_params(shots: list[dict]) -> list[CameraParams]:
    """Convert blueprint shot dicts → CameraParams objects."""
    params = []
    for s in shots:
        params.append(CameraParams(
            start_frame=s.get("start_frame", 0),
            end_frame=s.get("end_frame", int(s.get("duration_sec", 3) * RENDER_FPS)),
            preset=s.get("preset", "orbit"),
        ))
    return params


def _total_duration(shots: list[dict]) -> float:
    return sum(s.get("duration_sec", 3.0) for s in shots)


# ── Main pipeline ──────────────────────────────────────────────────────────────

def run_pipeline(glb_path: str, output_mp4: str | None = None) -> str:
    """
    Full pipeline: GLB → final vertical MP4.
    Returns the path to the finished video.
    """
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    state = PipelineState(glb_path=glb_path)

    # ── Skill 1a: Static render (for Vision analysis) ─────────────────────────
    log.info("Skill 1 (static): rendering preview PNG …")
    t0 = time.time()
    state.static_png = render_static(glb_path)
    log.info("  → %s (%.1fs)", state.static_png, time.time() - t0)

    # ── Skill 2: Vision analysis → blueprint ──────────────────────────────────
    log.info("Skill 2: analysing with Vision model …")
    t0 = time.time()
    state.blueprint = analyse_and_blueprint(state.static_png)
    log.info("  → hook_text: %r  mood: %s (%.1fs)",
             state.blueprint["hook_text"],
             state.blueprint.get("mood", "?"),
             time.time() - t0)

    # ── Director: validate & finalise plan ────────────────────────────────────
    state.execution_plan = director_plan(state.blueprint)
    shots = state.execution_plan["camera_shots"]
    mood = state.execution_plan["mood"]
    total_sec = _total_duration(shots)
    log.info("Execution plan: %.1fs total, %d shots", total_sec, len(shots))

    # ── Skill 1b: Animated render (grey model) ────────────────────────────────
    log.info("Skill 1 (animated): rendering grey model MP4 …")
    t0 = time.time()
    camera_params = _shots_to_camera_params(shots)
    state.grey_video = render_animated(glb_path, camera_params)
    log.info("  → %s (%.1fs)", state.grey_video, time.time() - t0)

    # ── Skill 3: Vid2Vid texturing ────────────────────────────────────────────
    log.info("Skill 3: applying texture via Vid2Vid …")
    t0 = time.time()
    state.textured_video = apply_texture(
        state.grey_video,
        state.blueprint["visual_prompt"],
    )
    log.info("  → %s (%.1fs)", state.textured_video, time.time() - t0)

    # ── Skill 4: Audio generation ─────────────────────────────────────────────
    log.info("Skill 4: generating BGM (%s, %.1fs) …", mood, total_sec)
    t0 = time.time()
    state.audio = generate_audio(total_sec, mood)
    log.info("  → %s (%.1fs)", state.audio, time.time() - t0)

    # ── Skill 5: Final composition ────────────────────────────────────────────
    log.info("Skill 5: composing final video …")
    t0 = time.time()
    if output_mp4 is None:
        stem = Path(glb_path).stem
        output_mp4 = os.path.join(OUTPUT_DIR, f"{stem}_viral.mp4")

    state.final_video = compose_final_video(
        textured_video_path=state.textured_video,
        audio_path=state.audio,
        hook_text=state.blueprint["hook_text"],
        camera_shots=shots,
        output_mp4=output_mp4,
    )
    log.info("  → %s (%.1fs)", state.final_video, time.time() - t0)

    log.info("Pipeline complete! Output: %s", state.final_video)
    return state.final_video


# ── CLI entry point ────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate a viral short video from a GLB 3D model."
    )
    parser.add_argument("glb", help="Path to the input GLB file")
    parser.add_argument("--output", "-o", default=None, help="Output MP4 path")
    args = parser.parse_args()

    if not os.path.isfile(args.glb):
        sys.exit(f"Error: GLB file not found: {args.glb}")

    final = run_pipeline(args.glb, args.output)
    print(f"\nDone! Your viral video is at:\n  {final}")


if __name__ == "__main__":
    main()
