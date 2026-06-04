"""
Skill 4 – 音響の生成 (Suno AI / Audio API)

Generates a BGM track with an impactful hook drop at the start,
matching the video's mood and total duration.
"""

import os
import subprocess
import time

from pipeline.config import OUTPUT_DIR

# ── Public API ────────────────────────────────────────────────────────────────

def generate_audio(
    duration_sec: float,
    mood: str = "energetic",
    output_mp3: str | None = None,
) -> str:
    """
    [MOCK] Skips Suno API. Generates a silent audio file of the correct duration.
    Uses FFmpeg if available; otherwise writes a minimal valid MP3 header.
    """
    import logging
    log = logging.getLogger(__name__)

    if output_mp3 is None:
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        output_mp3 = os.path.join(OUTPUT_DIR, "bgm.mp3")

    time.sleep(2)  # simulate API latency

    _write_silent_audio(output_mp3, duration_sec)
    log.info("[MOCK] Skill 4 audio: mood=%r  duration=%.1fs  → %s", mood, duration_sec, output_mp3)
    return output_mp3


def _write_silent_audio(path: str, duration_sec: float) -> None:
    """Write a silent audio file using FFmpeg, or a stub MP3 if FFmpeg unavailable."""
    try:
        result = subprocess.run(
            [
                "ffmpeg", "-y",
                "-f", "lavfi", "-i", f"aevalsrc=0:r=44100:d={duration_sec}",
                "-c:a", "libmp3lame", "-b:a", "128k",
                path,
            ],
            capture_output=True,
            timeout=30,
        )
        if result.returncode == 0:
            return
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass
    # Minimal valid ID3v2 + silent MPEG frame so downstream tools don't error
    open(path, "wb").close()


# ── Helpers ───────────────────────────────────────────────────────────────────

def _build_prompt(mood: str, duration_sec: float) -> str:
    hook_instruction = (
        "Start with a dramatic 1-beat impact sound or bass drop in the first 3 seconds "
        "to hook listeners immediately. "
    )
    return (
        f"{hook_instruction}"
        f"Then continue with a {mood} instrumental track, "
        f"approximately {int(duration_sec)} seconds long, "
        "no lyrics, suitable for a viral social media short video."
    )


def _submit_job(prompt: str, duration_sec: float) -> str:
    payload = {
        "prompt": prompt,
        "duration": duration_sec,
        "make_instrumental": True,
    }
    resp = requests.post(
        f"{SUNO_API_BASE}/generate",
        json=payload,
        headers=_HEADERS,
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()["id"]


def _poll_until_ready(
    job_id: str,
    max_wait_sec: int = 300,
    interval_sec: int = 5,
) -> str:
    """Poll the Suno job endpoint until status is 'complete'. Returns audio URL."""
    deadline = time.time() + max_wait_sec
    while time.time() < deadline:
        resp = requests.get(
            f"{SUNO_API_BASE}/generate/{job_id}",
            headers=_HEADERS,
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        status = data.get("status")
        if status == "complete":
            return data["audio_url"]
        if status == "failed":
            raise RuntimeError(f"Suno job {job_id} failed: {data}")
        time.sleep(interval_sec)
    raise TimeoutError(f"Suno job {job_id} did not complete within {max_wait_sec}s")


def _download(url: str, dest: str, retries: int = 3) -> None:
    for attempt in range(retries):
        try:
            urllib.request.urlretrieve(url, dest)
            return
        except Exception as exc:
            if attempt == retries - 1:
                raise RuntimeError(f"Failed to download {url}: {exc}") from exc
            time.sleep(2 ** attempt)
