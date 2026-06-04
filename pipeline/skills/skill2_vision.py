"""
Skill 2 – 構成と設計図の作成 (LLM Vision)

[MOCK MODE] Returns a hardcoded viral blueprint without calling OpenAI.
Swap analyse_and_blueprint() body for the real implementation when API keys are ready.
"""

import json
import logging
import time

log = logging.getLogger(__name__)


def analyse_and_blueprint(png_path: str) -> dict:
    """
    [MOCK] Returns a hardcoded viral blueprint without calling OpenAI.
    Simulates the latency of a real Vision API call.
    """
    time.sleep(2)

    blueprint = {
        "visual_prompt": (
            "A sleek futuristic product rotating in a dark studio, "
            "dramatic rim lighting, metallic surfaces reflecting neon blue and purple, "
            "photorealistic 8K render, cinematic depth of field"
        ),
        "hook_text": "YOU WONT BELIEVE THIS!",
        "mood": "cinematic epic",
        "camera_shots": [
            {
                "index": 0,
                "description": "Hook: extreme close-up dutch tilt, snap cut",
                "preset": "dutch_tilt",
                "duration_sec": 3.0,
                "start_frame": 0,
                "end_frame": 90,
            },
            {
                "index": 1,
                "description": "Dramatic zoom-out reveal",
                "preset": "zoomout",
                "duration_sec": 8.0,
                "start_frame": 90,
                "end_frame": 330,
            },
            {
                "index": 2,
                "description": "360 orbit product showcase",
                "preset": "orbit",
                "duration_sec": 12.0,
                "start_frame": 330,
                "end_frame": 690,
            },
            {
                "index": 3,
                "description": "Low angle upward pan — monumental feel",
                "preset": "pan_up",
                "duration_sec": 8.0,
                "start_frame": 690,
                "end_frame": 930,
            },
            {
                "index": 4,
                "description": "Final orbit close with dutch tilt outro",
                "preset": "dutch_tilt",
                "duration_sec": 10.0,
                "start_frame": 930,
                "end_frame": 1230,
            },
        ],
    }
    _validate_blueprint(blueprint)
    log.info("[MOCK] Skill 2 blueprint: hook_text=%r  shots=%d", blueprint["hook_text"], len(blueprint["camera_shots"]))
    return blueprint


def _validate_blueprint(bp: dict) -> None:
    required = {"visual_prompt", "hook_text", "camera_shots"}
    missing = required - bp.keys()
    if missing:
        raise ValueError(f"Blueprint missing keys: {missing}")
    if not isinstance(bp["camera_shots"], list) or len(bp["camera_shots"]) == 0:
        raise ValueError("camera_shots must be a non-empty list")
