"""
Skill 4 – 音響の生成 (Suno AI / Audio API)

Generates a BGM track with an impactful hook drop at the start,
matching the video's mood and total duration.
"""

import os
import time
import urllib.request

import requests

from pipeline.config import OUTPUT_DIR, SUNO_API_KEY, SUNO_API_BASE

_HEADERS = {
    "Authorization": f"Bearer {SUNO_API_KEY}",
    "Content-Type": "application/json",
}

# ── Public API ────────────────────────────────────────────────────────────────

def generate_audio(
    duration_sec: float,
    mood: str = "energetic",
    output_mp3: str | None = None,
) -> str:
    """
    Generate a BGM track for `duration_sec` seconds with `mood`.
    Returns path to the output MP3.

    The prompt instructs the model to open with an impactful "hook drop"
    (bass hit, riser, etc.) in the first 3 seconds.
    """
    if output_mp3 is None:
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        output_mp3 = os.path.join(OUTPUT_DIR, "bgm.mp3")

    prompt = _build_prompt(mood, duration_sec)
    job_id = _submit_job(prompt, duration_sec)
    audio_url = _poll_until_ready(job_id)
    _download(audio_url, output_mp3)
    return output_mp3


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
