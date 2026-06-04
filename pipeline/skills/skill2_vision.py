"""
Skill 2 – 構成と設計図の作成 (Replicate / Llama Vision)

Sends front.png to meta/llama-3.2-90b-vision-instruct and parses the
JSON blueprint it returns.

TEST_MODE=true (default): prints request params, returns hardcoded blueprint.
TEST_MODE=false          : live Replicate API call.
"""

import base64
import json
import logging
import time

from pipeline.config import (
    REPLICATE_API_TOKEN,
    REPLICATE_VISION_MODEL,
    TEST_MODE,
)

log = logging.getLogger(__name__)

_SYSTEM_PROMPT = """\
You are a viral short-video director. Analyse the product image and return ONLY
a valid JSON object (no markdown, no commentary) with these exact keys:
{
  "visual_prompt": "<detailed diffusion prompt for video texturing>",
  "hook_text": "<ultra-short punchy hook (6 words max, ALL CAPS)>",
  "mood": "<one descriptive string for the music mood>",
  "camera_shots": [
    {
      "index": 0,
      "description": "<what this shot shows>",
      "preset": "<orbit|zoomout|pan_up|dutch_tilt>",
      "duration_sec": 3.0,
      "start_frame": 0,
      "end_frame": 90
    }
  ]
}
Total camera_shots duration must be 58 seconds or less.
"""

_MOCK_BLUEPRINT = {
    "visual_prompt": (
        "A sleek futuristic product rotating in a dark studio, "
        "dramatic rim lighting, metallic surfaces reflecting neon blue and purple, "
        "photorealistic 8K render, cinematic depth of field"
    ),
    "hook_text": "YOU WONT BELIEVE THIS!",
    "mood": "cinematic epic",
    "camera_shots": [
        {"index": 0, "description": "Hook: extreme close-up dutch tilt", "preset": "dutch_tilt",
         "duration_sec": 3.0, "start_frame": 0, "end_frame": 90},
        {"index": 1, "description": "Dramatic zoom-out reveal", "preset": "zoomout",
         "duration_sec": 8.0, "start_frame": 90, "end_frame": 330},
        {"index": 2, "description": "360 orbit product showcase", "preset": "orbit",
         "duration_sec": 12.0, "start_frame": 330, "end_frame": 690},
        {"index": 3, "description": "Low angle upward pan", "preset": "pan_up",
         "duration_sec": 8.0, "start_frame": 690, "end_frame": 930},
        {"index": 4, "description": "Final dutch tilt outro", "preset": "dutch_tilt",
         "duration_sec": 10.0, "start_frame": 930, "end_frame": 1230},
    ],
}


# ── Public API ────────────────────────────────────────────────────────────────

def analyse_and_blueprint(png_path: str) -> dict:
    """
    Analyse front.png with Llama Vision and return a viral blueprint dict.
    Falls back to mock data when TEST_MODE is True.
    """
    with open(png_path, "rb") as f:
        image_b64 = base64.b64encode(f.read()).decode()

    params = {
        "model": REPLICATE_VISION_MODEL,
        "input": {
            "image": f"data:image/png;base64,{image_b64}",
            "prompt": _SYSTEM_PROMPT,
            "max_tokens": 1024,
            "temperature": 0.3,
        },
    }

    if TEST_MODE:
        log.info("[TEST_MODE] Skill 2 – would call replicate.run:")
        log.info("  model : %s", params["model"])
        log.info("  prompt: %d chars", len(params["input"]["prompt"]))
        log.info("  image : <base64 PNG, %d bytes>", len(image_b64))
        time.sleep(0.5)
        blueprint = _MOCK_BLUEPRINT
        log.info("[TEST_MODE] Returning mock blueprint: hook=%r  shots=%d",
                 blueprint["hook_text"], len(blueprint["camera_shots"]))
        return blueprint

    # ── Live Replicate call ───────────────────────────────────────────────────
    import os
    import replicate

    os.environ["REPLICATE_API_TOKEN"] = REPLICATE_API_TOKEN
    raw_output = replicate.run(params["model"], input=params["input"])

    # Llama Vision streams tokens — join them
    text = "".join(raw_output) if hasattr(raw_output, "__iter__") and not isinstance(raw_output, str) else str(raw_output)

    blueprint = _parse_blueprint(text)
    _validate_blueprint(blueprint)
    log.info("Skill 2 blueprint: hook=%r  shots=%d",
             blueprint["hook_text"], len(blueprint["camera_shots"]))
    return blueprint


# ── Helpers ───────────────────────────────────────────────────────────────────

def _parse_blueprint(text: str) -> dict:
    """Extract JSON from model output (strips markdown fences if present)."""
    text = text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    return json.loads(text)


def _validate_blueprint(bp: dict) -> None:
    required = {"visual_prompt", "hook_text", "camera_shots"}
    missing = required - bp.keys()
    if missing:
        raise ValueError(f"Blueprint missing keys: {missing}")
    if not isinstance(bp["camera_shots"], list) or len(bp["camera_shots"]) == 0:
        raise ValueError("camera_shots must be a non-empty list")
