"""
Skill 3 – 質感の生成 (Replicate / Video-to-Video)

Takes the grey-model MP4 and a visual prompt, calls a Vid2Vid model
on Replicate, and returns the textured video MP4 path.
"""

import os
import time
import urllib.request

import replicate

from pipeline.config import (
    OUTPUT_DIR,
    REPLICATE_API_TOKEN,
    REPLICATE_VID2VID_MODEL,
)

os.environ["REPLICATE_API_TOKEN"] = REPLICATE_API_TOKEN

# ── Public API ────────────────────────────────────────────────────────────────

def apply_texture(
    grey_video_path: str,
    visual_prompt: str,
    output_mp4: str | None = None,
    strength: float = 0.75,        # how much the prompt overrides the input
    num_inference_steps: int = 20,
) -> str:
    """
    Run Vid2Vid on `grey_video_path` guided by `visual_prompt`.
    Returns path to the textured MP4.

    `strength` (0–1): lower = preserves shape better, higher = more creative.
    """
    if output_mp4 is None:
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        output_mp4 = os.path.join(OUTPUT_DIR, "textured.mp4")

    with open(grey_video_path, "rb") as f:
        video_bytes = f.read()

    # Replicate client accepts file-like objects or URLs for video inputs
    output = replicate.run(
        REPLICATE_VID2VID_MODEL,
        input={
            "video": video_bytes,
            "prompt": visual_prompt,
            "negative_prompt": "blurry, low quality, watermark, text, distorted geometry",
            "strength": strength,
            "num_inference_steps": num_inference_steps,
        },
    )

    # `output` is typically a URL string pointing to the generated video
    video_url = output if isinstance(output, str) else output[0]
    _download(video_url, output_mp4)
    return output_mp4


# ── Helpers ───────────────────────────────────────────────────────────────────

def _download(url: str, dest: str, retries: int = 3) -> None:
    for attempt in range(retries):
        try:
            urllib.request.urlretrieve(url, dest)
            return
        except Exception as exc:
            if attempt == retries - 1:
                raise RuntimeError(f"Failed to download {url}: {exc}") from exc
            time.sleep(2 ** attempt)
