"""
Skill 5 – 構造化と最終編集 (Remotion + FFmpeg)

Composites textured video clips, kinetic typography for the hook text,
and the BGM track into the final 9:16 MP4.

Strategy:
  1. Write a Remotion composition (JSX) programmatically.
  2. Render it to a PNG-sequence via `npx remotion render`.
  3. Mix with FFmpeg: encode PNG-sequence + audio → final MP4.

If Remotion is unavailable, falls back to a pure FFmpeg pipeline
(drawtext filter for hook text, amerge for audio).
"""

import json
import os
import shutil
import subprocess
import tempfile
import textwrap

from pipeline.config import (
    FFMPEG_BIN,
    OUTPUT_DIR,
    RENDER_FPS,
    RENDER_HEIGHT,
    RENDER_WIDTH,
    REMOTION_PROJECT_DIR,
    HOOK_DURATION_SEC,
)

# ── Public API ────────────────────────────────────────────────────────────────

def compose_final_video(
    textured_video_path: str,
    audio_path: str,
    hook_text: str,
    camera_shots: list[dict],
    output_mp4: str | None = None,
) -> str:
    """
    Produce the final vertical short video.
    Falls back gracefully when inputs are mock stubs (empty files).
    Returns path to the output MP4.
    """
    import logging
    log = logging.getLogger(__name__)

    if output_mp4 is None:
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        output_mp4 = os.path.join(OUTPUT_DIR, "final_video.mp4")

    video_ok = os.path.isfile(textured_video_path) and os.path.getsize(textured_video_path) > 0
    audio_ok = os.path.isfile(audio_path) and os.path.getsize(audio_path) > 0

    if _remotion_available() and video_ok and audio_ok:
        return _compose_with_remotion(
            textured_video_path, audio_path, hook_text, camera_shots, output_mp4
        )
    elif _ffmpeg_available() and video_ok and audio_ok:
        return _compose_with_ffmpeg(textured_video_path, audio_path, hook_text, output_mp4)
    elif _ffmpeg_available() and video_ok:
        # No real audio — add silent track
        return _compose_video_only(textured_video_path, hook_text, output_mp4)
    else:
        # Full mock fallback: just copy/rename the video stub
        log.warning(
            "[MOCK] Skill 5: FFmpeg unavailable or inputs are stubs. "
            "Writing placeholder final video."
        )
        shutil.copy2(textured_video_path, output_mp4) if video_ok else open(output_mp4, "wb").close()
        return output_mp4


# ── Remotion path ─────────────────────────────────────────────────────────────

def _compose_with_remotion(
    video: str, audio: str, hook_text: str, shots: list[dict], out: str
) -> str:
    comp_dir = _write_remotion_composition(video, audio, hook_text, shots)
    frames_dir = os.path.join(comp_dir, "frames")
    os.makedirs(frames_dir, exist_ok=True)

    # Render frame sequence
    subprocess.run(
        ["npx", "remotion", "render", comp_dir, "ViralShort", frames_dir],
        check=True,
    )

    # Encode to MP4 with audio
    total_sec = sum(s.get("duration_sec", 3) for s in shots)
    _ffmpeg_encode_frames(frames_dir, audio, out, total_sec)
    return out


def _write_remotion_composition(
    video: str, audio: str, hook_text: str, shots: list[dict]
) -> str:
    """Write a minimal Remotion project to a temp directory and return its path."""
    comp_dir = tempfile.mkdtemp(prefix="remotion_")
    total_frames = int(sum(s.get("duration_sec", 3) for s in shots) * RENDER_FPS)
    hook_frames = HOOK_DURATION_SEC * RENDER_FPS

    jsx = textwrap.dedent(f"""
        import {{ Composition, Video, Audio, AbsoluteFill, useCurrentFrame, interpolate }} from 'remotion';

        const HookText = ({{ text }}) => {{
          const frame = useCurrentFrame();
          const opacity = interpolate(frame, [0, 5, {hook_frames - 5}, {hook_frames}], [0, 1, 1, 0]);
          const scale  = interpolate(frame, [0, 8], [0.8, 1.05]);
          return (
            <AbsoluteFill style={{{{ display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}}}>
              <p style={{{{
                fontSize: 72, fontWeight: 900, color: '#FFFFFF',
                textShadow: '0 4px 24px rgba(0,0,0,0.8)',
                opacity, transform: `scale(${{scale}})`,
                textTransform: 'uppercase', textAlign: 'center',
                fontFamily: 'Impact, Arial Black, sans-serif',
                padding: '0 40px',
              }}}}>
                {hook_text}
              </p>
            </AbsoluteFill>
          );
        }};

        export const RemotionRoot = () => (
          <Composition
            id="ViralShort"
            component={{() => (
              <AbsoluteFill>
                <Video src={repr(video)} />
                <Audio src={repr(audio)} />
                <HookText text={repr(hook_text)} />
              </AbsoluteFill>
            )}}
            durationInFrames={{{total_frames}}}
            fps={{{RENDER_FPS}}}
            width={{{RENDER_WIDTH}}}
            height={{{RENDER_HEIGHT}}}
          />
        );
    """)

    with open(os.path.join(comp_dir, "Root.tsx"), "w") as f:
        f.write(jsx)

    return comp_dir


# ── FFmpeg fallback ───────────────────────────────────────────────────────────

def _compose_with_ffmpeg(
    video: str, audio: str, hook_text: str, out: str
) -> str:
    """
    Pure FFmpeg composition:
    - Overlay kinetic hook text for first HOOK_DURATION_SEC seconds.
    - Mix BGM audio.
    - Output 9:16 H.264 MP4.
    """
    safe_text = hook_text.replace("'", "\\'").replace(":", "\\:")
    hook_end = float(HOOK_DURATION_SEC)

    drawtext = (
        f"drawtext=text='{safe_text}'"
        f":fontsize=80:fontcolor=white:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
        f":x=(w-text_w)/2:y=(h-text_h)/2"
        f":enable='between(t,0,{hook_end})'"
        f":shadowcolor=black:shadowx=3:shadowy=3"
        f":alpha='if(between(t,0,0.3),t/0.3,if(between(t,{hook_end-0.3},{hook_end}),({hook_end}-t)/0.3,1))'"
    )

    scale = (
        f"scale={RENDER_WIDTH}:{RENDER_HEIGHT}:force_original_aspect_ratio=decrease,"
        f"pad={RENDER_WIDTH}:{RENDER_HEIGHT}:(ow-iw)/2:(oh-ih)/2"
    )
    cmd = [
        FFMPEG_BIN, "-y",
        "-i", video,
        "-i", audio,
        "-filter_complex",
        f"[0:v]{scale},{drawtext}[v];"
        f"[1:a]aformat=sample_fmts=fltp:sample_rates=44100[a]",
        "-map", "[v]", "-map", "[a]",
        "-c:v", "libx264", "-preset", "fast", "-crf", "18",
        "-c:a", "aac", "-b:a", "192k",
        "-shortest",
        out,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg failed:\n{result.stderr[-2000:]}")
    return out


def _ffmpeg_encode_frames(frames_dir: str, audio: str, out: str, _total_sec: float) -> None:
    cmd = [
        FFMPEG_BIN, "-y",
        "-framerate", str(RENDER_FPS),
        "-i", os.path.join(frames_dir, "%06d.png"),
        "-i", audio,
        "-c:v", "libx264", "-preset", "fast", "-crf", "18",
        "-c:a", "aac", "-b:a", "192k",
        "-shortest", out,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg encode failed:\n{result.stderr[-2000:]}")


# ── Utils ─────────────────────────────────────────────────────────────────────

def _remotion_available() -> bool:
    return shutil.which("npx") is not None and os.path.isdir(REMOTION_PROJECT_DIR)


def _ffmpeg_available() -> bool:
    return shutil.which(FFMPEG_BIN) is not None


def _compose_video_only(video: str, hook_text: str, out: str) -> str:
    """FFmpeg compose with generated silent audio."""
    import tempfile
    silent = os.path.join(tempfile.gettempdir(), "silent_bgm.mp3")
    subprocess.run(
        ["ffmpeg", "-y", "-f", "lavfi", "-i", "aevalsrc=0:r=44100:d=60",
         "-c:a", "libmp3lame", "-b:a", "128k", silent],
        capture_output=True,
    )
    return _compose_with_ffmpeg(video, silent, hook_text, out)
