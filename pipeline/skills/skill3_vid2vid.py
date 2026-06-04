"""
Skill 3 – 質感の生成 (Replicate / Video-to-Video)

Takes the grey-model MP4 and a visual prompt, calls a Vid2Vid model
on Replicate, and returns the textured video MP4 path.
"""

import os
import time

from pipeline.config import OUTPUT_DIR

# ── Public API ────────────────────────────────────────────────────────────────

def apply_texture(
    grey_video_path: str,
    visual_prompt: str,
    output_mp4: str | None = None,
    strength: float = 0.75,
    num_inference_steps: int = 20,
) -> str:
    """
    [MOCK] Skips Replicate. Copies the grey model video as the 'textured' output.
    Simulates the latency of a real Vid2Vid API call.
    """
    import logging, shutil
    log = logging.getLogger(__name__)

    if output_mp4 is None:
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        output_mp4 = os.path.join(OUTPUT_DIR, "textured.mp4")

    time.sleep(3)  # simulate API round-trip

    if os.path.isfile(grey_video_path) and os.path.getsize(grey_video_path) > 0:
        shutil.copy2(grey_video_path, output_mp4)
    else:
        # Grey video might be an empty placeholder — just copy it
        shutil.copy2(grey_video_path, output_mp4) if os.path.isfile(grey_video_path) else open(output_mp4, "wb").close()

    log.info(
        "[MOCK] Skill 3 Vid2Vid: prompt=%r  → %s",
        visual_prompt[:60] + "...",
        output_mp4,
    )
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
