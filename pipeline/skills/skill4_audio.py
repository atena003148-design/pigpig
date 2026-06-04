"""
Skill 4 – 音響生成 (Replicate / MusicGen)

Generates a BGM track using meta/musicgen-large on Replicate.

TEST_MODE=true (default): prints request params, generates a silent MP3 via FFmpeg.
TEST_MODE=false          : live Replicate API call.
"""

import logging
import os
import subprocess
import time
import urllib.request

from pipeline.config import (
    FFMPEG_BIN,
    OUTPUT_DIR,
    REPLICATE_API_TOKEN,
    REPLICATE_AUDIO_MODEL,
    TEST_MODE,
)

log = logging.getLogger(__name__)


# ── Public API ────────────────────────────────────────────────────────────────

def generate_audio(
    duration_sec: float,
    mood: str,
    output_mp3: str | None = None,
) -> str:
    """
    Generate a BGM track matching `mood` and `duration_sec`.
    Returns path to the output MP3.
    """
    if output_mp3 is None:
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        output_mp3 = os.path.join(OUTPUT_DIR, "bgm.mp3")

    # MusicGen accepts duration as integer seconds (max 30 s per call)
    gen_duration = min(int(duration_sec), 30)
    prompt = f"{mood} background music, no vocals, cinematic, professional, loop-ready"

    params = {
        "model": REPLICATE_AUDIO_MODEL,
        "input": {
            "prompt": prompt,
            "duration": gen_duration,
            "model_version": "large",
            "output_format": "mp3",
            "normalization_strategy": "peak",
        },
    }

    if TEST_MODE:
        log.info("[TEST_MODE] Skill 4 – would call replicate.run:")
        log.info("  model   : %s", params["model"])
        log.info("  prompt  : %r", prompt)
        log.info("  duration: %d s", gen_duration)
        time.sleep(0.5)
        _generate_silent_mp3(output_mp3, duration_sec)
        log.info("[TEST_MODE] Silent BGM stub written: %s", output_mp3)
        return output_mp3

    # ── Live Replicate call ───────────────────────────────────────────────────
    import replicate

    os.environ["REPLICATE_API_TOKEN"] = REPLICATE_API_TOKEN

    output_url = replicate.run(params["model"], input=params["input"])
    _download(str(output_url), output_mp3)
    log.info("Skill 4 BGM → %s", output_mp3)
    return output_mp3


# ── Helpers ───────────────────────────────────────────────────────────────────

def _generate_silent_mp3(path: str, duration_sec: float) -> None:
    """Create a silent MP3 of the requested duration using FFmpeg."""
    result = subprocess.run(
        [
            FFMPEG_BIN, "-y",
            "-f", "lavfi", "-i", f"anullsrc=r=44100:cl=stereo",
            "-t", str(duration_sec),
            "-c:a", "libmp3lame", "-b:a", "128k",
            path,
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg silent audio failed:\n{result.stderr[-1000:]}")


def _download(url: str, dest: str, retries: int = 3) -> None:
    for attempt in range(retries):
        try:
            urllib.request.urlretrieve(url, dest)
            return
        except Exception as exc:
            if attempt == retries - 1:
                raise RuntimeError(f"Failed to download {url}: {exc}") from exc
            time.sleep(2 ** attempt)
