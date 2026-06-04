import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Video,
  Easing,
  staticFile,
} from "remotion";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CameraShot {
  index: number;
  description: string;
  preset: string;
  duration_sec: number;
  start_frame: number;
  end_frame: number;
}

interface ViralReelProps {
  hookText: string;
  videoSrc: string;
  shots: CameraShot[];
}

// ── Progress Bar ──────────────────────────────────────────────────────────────

const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = frame / durationInFrames;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 4,
        background: "rgba(255,255,255,0.15)",
        zIndex: 100,
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${progress * 100}%`,
          background: "linear-gradient(90deg, #ff3cac, #784ba0, #2b86c5)",
          borderRadius: "0 2px 2px 0",
          boxShadow: "0 0 8px rgba(255,60,172,0.8)",
          transition: "none",
        }}
      />
    </div>
  );
};

// ── Stagger Hook Text ─────────────────────────────────────────────────────────

const StaggerHookText: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Show hook text for first 3 seconds, then fade out
  const hookEndFrame = fps * 3;
  const containerOpacity = interpolate(
    frame,
    [hookEndFrame - fps * 0.3, hookEndFrame],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const chars = text.split("");
  const framesPerChar = 2.5; // new char every 2.5 frames → snappy stagger

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: containerOpacity,
        zIndex: 50,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          padding: "0 60px",
          lineHeight: 1.1,
        }}
      >
        {chars.map((char, i) => {
          const charStart = i * framesPerChar;
          const charEnd = charStart + 8;

          const opacity = interpolate(frame, [charStart, charStart + 4], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          });

          const scale = interpolate(frame, [charStart, charEnd], [2.2, 1.0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.elastic(1.2)),
          });

          const translateY = interpolate(frame, [charStart, charEnd], [30, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.back(1.5)),
          });

          // Alternating color for impact
          const hue = (i * 37) % 360;
          const isSpace = char === " ";

          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                fontSize: 88,
                fontWeight: 900,
                fontFamily: "'Impact', 'Arial Black', 'Haas Grotesk', sans-serif",
                color: i % 3 === 0 ? "#FFFFFF" : i % 3 === 1 ? "#FFD600" : "#FF3CAC",
                textShadow:
                  "0 0 20px rgba(0,0,0,0.9), 0 4px 8px rgba(0,0,0,0.8), 2px 2px 0 #000",
                WebkitTextStroke: "1px rgba(0,0,0,0.6)",
                letterSpacing: "0.02em",
                textTransform: "uppercase",
                opacity,
                transform: `scale(${scale}) translateY(${translateY}px)`,
                transformOrigin: "center bottom",
                margin: isSpace ? "0 12px" : "0 2px",
                minWidth: isSpace ? 20 : undefined,
              }}
            >
              {char}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── White Flash at cuts ───────────────────────────────────────────────────────

const CutFlash: React.FC<{ shots: CameraShot[] }> = ({ shots }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const flashDuration = Math.round(fps * 0.1); // 0.1s flash (3 frames @30fps)

  // Build per-frame flash opacity from all cut points
  const flashOpacity = shots.reduce((acc, shot) => {
    const cutFrame = shot.start_frame;
    if (cutFrame === 0) return acc; // skip first frame
    const localF = frame - cutFrame;
    if (localF >= 0 && localF < flashDuration) {
      const v = interpolate(localF, [0, flashDuration * 0.4, flashDuration], [0.95, 0.7, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.quad),
      });
      return Math.max(acc, v);
    }
    return acc;
  }, 0);

  if (flashOpacity === 0) return null;

  return (
    <AbsoluteFill
      style={{
        background: `rgba(255, 255, 255, ${flashOpacity})`,
        zIndex: 80,
        pointerEvents: "none",
      }}
    />
  );
};

// ── Cinematic Letterbox (subtle vignette) ─────────────────────────────────────

const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.55) 100%)",
      zIndex: 10,
      pointerEvents: "none",
    }}
  />
);

// ── Scan Line overlay for filmic look ─────────────────────────────────────────

const ScanLines: React.FC = () => {
  const frame = useCurrentFrame();
  // Subtle 2px scanline pattern
  return (
    <AbsoluteFill
      style={{
        backgroundImage:
          "repeating-linear-gradient(0deg, rgba(0,0,0,0.04) 0px, rgba(0,0,0,0.04) 1px, transparent 1px, transparent 4px)",
        zIndex: 5,
        pointerEvents: "none",
        opacity: 0.6,
      }}
    />
  );
};

// ── Main ViralReel Composition ────────────────────────────────────────────────

export const ViralReel: React.FC<ViralReelProps> = ({
  hookText,
  videoSrc,
  shots,
}) => {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* Background video */}
      <Video
        src={videoSrc}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />

      {/* Filmic overlays */}
      <ScanLines />
      <Vignette />

      {/* Hook text stagger (first 3s) */}
      <StaggerHookText text={hookText} />

      {/* Cut flash at each shot transition */}
      <CutFlash shots={shots} />

      {/* Progress bar */}
      <ProgressBar />
    </AbsoluteFill>
  );
};
