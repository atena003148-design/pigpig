"""
Skill 2 – 構成と設計図の作成 (LLM Vision)

Sends the static preview PNG to a Vision model and receives a
structured JSON blueprint that drives the rest of the pipeline.
"""

import base64
import json
import os
from pathlib import Path

import openai

from pipeline.config import OPENAI_API_KEY, OPENAI_MODEL_VISION, MAX_DURATION_SEC

openai.api_key = OPENAI_API_KEY

# ── System prompt ─────────────────────────────────────────────────────────────

_SYSTEM_PROMPT = """\
You are a viral short-video director specialising in Instagram Reels and TikTok.
Your job is to analyse a 3D model preview image and produce a tight JSON blueprint
for a under-60-second vertical video that will stop the scroll.

Rules:
- Total duration of all shots must not exceed {max_dur} seconds.
- The first shot MUST be a hook (≤ 3 s) that immediately grabs attention.
- Use fast cuts, dynamic camera moves (whip-pan, extreme zoom, low-angle push-in).
- visual_prompt must be vivid, specific, and compatible with a video diffusion model.
- hook_text must be punchy (≤ 6 words), uppercase, no punctuation except "!".
- Respond ONLY with minified JSON matching the schema below — no markdown, no extra text.

Schema:
{{
  "visual_prompt": "<string>",
  "hook_text": "<string>",
  "mood": "<string>",
  "camera_shots": [
    {{
      "index": <int>,
      "description": "<string>",
      "preset": "<orbit|zoomout|pan_up|dutch_tilt>",
      "duration_sec": <float>,
      "start_frame": <int>,
      "end_frame": <int>
    }}
  ]
}}
""".format(max_dur=MAX_DURATION_SEC)

_USER_PROMPT = (
    "Analyse this 3D model and generate the viral video blueprint JSON. "
    "Infer the object type, ideal aesthetic, and target audience from the image."
)


# ── Public API ────────────────────────────────────────────────────────────────

def analyse_and_blueprint(png_path: str) -> dict:
    """
    Send `png_path` to the Vision model and return the blueprint dict.
    Keys: visual_prompt, hook_text, mood, camera_shots (list of shot dicts).
    """
    image_b64 = _encode_image(png_path)

    response = openai.chat.completions.create(
        model=OPENAI_MODEL_VISION,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{image_b64}",
                            "detail": "high",
                        },
                    },
                    {"type": "text", "text": _USER_PROMPT},
                ],
            },
        ],
        max_tokens=1024,
        temperature=0.7,
    )

    raw = response.choices[0].message.content.strip()
    blueprint = json.loads(raw)
    _validate_blueprint(blueprint)
    return blueprint


# ── Helpers ───────────────────────────────────────────────────────────────────

def _encode_image(path: str) -> str:
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def _validate_blueprint(bp: dict) -> None:
    required = {"visual_prompt", "hook_text", "camera_shots"}
    missing = required - bp.keys()
    if missing:
        raise ValueError(f"Blueprint missing keys: {missing}")
    if not isinstance(bp["camera_shots"], list) or len(bp["camera_shots"]) == 0:
        raise ValueError("camera_shots must be a non-empty list")
