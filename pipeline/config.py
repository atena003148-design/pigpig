"""
Global configuration for the GLB → Viral Short Video pipeline.
Replace dummy values with real API keys before running.
"""

import os

# ── Output paths ──────────────────────────────────────────────────────────────
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")

# ── Blender ───────────────────────────────────────────────────────────────────
BLENDER_BIN = os.environ.get("BLENDER_BIN", "blender")          # path to blender executable
RENDER_WIDTH = 1080
RENDER_HEIGHT = 1920   # 9:16 vertical
RENDER_FPS = 30

# ── OpenAI (Vision + LLM Director) ───────────────────────────────────────────
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "sk-DUMMY")
OPENAI_MODEL_VISION = "gpt-4o"

# ── Replicate (Video-to-Video) ────────────────────────────────────────────────
REPLICATE_API_TOKEN = os.environ.get("REPLICATE_API_TOKEN", "r8_DUMMY")
REPLICATE_VID2VID_MODEL = "DUMMY/vid2vid-model:version_hash"

# ── Suno / Audio API ─────────────────────────────────────────────────────────
SUNO_API_KEY = os.environ.get("SUNO_API_KEY", "suno_DUMMY")
SUNO_API_BASE = "https://api.suno.ai/v1"   # placeholder

# ── Remotion / FFmpeg ─────────────────────────────────────────────────────────
FFMPEG_BIN = os.environ.get("FFMPEG_BIN", "ffmpeg")
REMOTION_PROJECT_DIR = os.path.join(os.path.dirname(__file__), "remotion_project")

# ── Video spec ────────────────────────────────────────────────────────────────
MAX_DURATION_SEC = 58   # stay safely under 60 s for reels
HOOK_DURATION_SEC = 3
