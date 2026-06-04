"""
Global configuration for the GLB → Viral Short Video pipeline.
All AI inference is routed through Replicate.
"""

import os

# ── Output paths ──────────────────────────────────────────────────────────────
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")

# ── Blender ───────────────────────────────────────────────────────────────────
BLENDER_BIN = os.environ.get("BLENDER_BIN", "blender")
RENDER_WIDTH = 1080
RENDER_HEIGHT = 1920   # 9:16 vertical
RENDER_FPS = 30

# ── Replicate (all AI calls) ──────────────────────────────────────────────────
REPLICATE_API_TOKEN = os.environ.get("REPLICATE_API_TOKEN", "r8_DUMMY")

# Skill 2 – Vision Director
REPLICATE_VISION_MODEL = "meta/llama-3.2-90b-vision-instruct"

# Skill 3 – Video-to-Video texturing
REPLICATE_VID2VID_MODEL = "lucataco/animatediff-controlnet:2cb3c1d3c2b04c26cc6ed0a2d1f55d9f9b26f3af5cd0b24f7a3f7f63b9c62e1a"

# Skill 4 – Music generation
REPLICATE_AUDIO_MODEL = "meta/musicgen:671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb"

# ── Remotion / FFmpeg ─────────────────────────────────────────────────────────
FFMPEG_BIN = os.environ.get("FFMPEG_BIN", "ffmpeg")
REMOTION_PROJECT_DIR = os.path.join(os.path.dirname(__file__), "remotion_project")

# ── Video spec ────────────────────────────────────────────────────────────────
MAX_DURATION_SEC = 58   # stay safely under 60 s for reels
HOOK_DURATION_SEC = 3

# ── Test mode (no real API calls) ─────────────────────────────────────────────
# Set TEST_MODE=false in env to enable live Replicate calls.
TEST_MODE = os.environ.get("TEST_MODE", "true").lower() != "false"
