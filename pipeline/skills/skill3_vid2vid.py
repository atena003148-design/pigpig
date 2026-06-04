"""
Skill 3 – 質感の生成 (Replicate / AnimateDiff-ControlNet)

Takes the grey-model MP4 and a visual prompt, submits to
lucataco/animatediff-controlnet on Replicate, and returns the
textured video MP4 path.

TEST_MODE=true (default): prints request params, copies grey video as output.
TEST_MODE=false          : live Replicate API call.
"""

import logging
import os
import shutil
import time
import urllib.request

from pipeline.config import (
    OUTPUT_DIR,
    REPLICATE_API_TOKEN,
    REPLICATE_VID2VID_MODEL,
    TEST_MODE,
)

log = logging.getLogger(__name__)


# ── Public API ────────────────────────────────────────────────────────────────

def apply_texture(
    grey_video_path: str,
    visual_prompt: str,
    output_mp4: str | None = None,
    strength: float = 0.75,
    num_inference_steps: int = 20,
) -> str:
    """
    Apply texture/style to the grey-model video via Vid2Vid.
    Returns path to the textured MP4.
    """
    if output_mp4 is None:
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        output_mp4 = os.path.join(OUTPUT_DIR, "textured.mp4")

    params = {
        "model": REPLICATE_VID2VID_MODEL,
        "input": {
            "video": grey_video_path,          # local path (Replicate SDK uploads it)
            "prompt": visual_prompt,
            "negative_prompt": "blurry, low quality, watermark, text",
            "controlnet_conditioning_scale": strength,
            "num_inference_steps": num_inference_steps,
            "width": 512,
            "height": 910,
        },
    }

    if TEST_MODE:
        log.info("[TEST_MODE] Skill 3 – would call replicate.run:")
        log.info("  model : %s", params["model"])
        log.info("  prompt: %r", visual_prompt[:80])
        log.info("  video : %s  strength=%.2f  steps=%d",
                 grey_video_path, strength, num_inference_steps)
        time.sleep(0.5)
        # Return grey video as stand-in
        _copy_or_stub(grey_video_path, output_mp4)
        log.info("[TEST_MODE] Returning grey video as textured stand-in: %s", output_mp4)
        return output_mp4

    # ── Live Replicate call ───────────────────────────────────────────────────
    import replicate

    os.environ["REPLICATE_API_TOKEN"] = REPLICATE_API_TOKEN

    with open(grey_video_path, "rb") as video_file:
        output_url = replicate.run(
            params["model"],
            input={**params["input"], "video": video_file},
        )

    _download(str(output_url), output_mp4)
    log.info("Skill 3 textured video → %s", output_mp4)
    return output_mp4


# ── Helpers ───────────────────────────────────────────────────────────────────

def _copy_or_stub(src: str, dst: str) -> None:
    if os.path.isfile(src):
        shutil.copy2(src, dst)
    else:
        open(dst, "wb").close()


def _download(url: str, dest: str, retries: int = 3) -> None:
    for attempt in range(retries):
        try:
            urllib.request.urlretrieve(url, dest)
            return
        except Exception as exc:
            if attempt == retries - 1:
                raise RuntimeError(f"Failed to download {url}: {exc}") from exc
            time.sleep(2 ** attempt)
