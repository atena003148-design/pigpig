/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Composition, staticFile } from "remotion";
import { ViralReel } from "./ViralReel";

const DEMO_SHOTS = [
  { index: 0, description: "Hook: extreme close-up dutch tilt", preset: "dutch_tilt", duration_sec: 3.0, start_frame: 0, end_frame: 90 },
  { index: 1, description: "Dramatic zoom-out reveal", preset: "zoomout", duration_sec: 3.0, start_frame: 90, end_frame: 180 },
];

const TOTAL_FRAMES = 180;

const ViralReelAny = ViralReel as any;

export const RemotionRoot: React.FC = () => (
  <Composition
    id="ViralReel"
    component={ViralReelAny}
    durationInFrames={TOTAL_FRAMES}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={{
      hookText: "YOU WONT BELIEVE THIS!",
      videoSrc: staticFile("gray_anim.mp4"),
      shots: DEMO_SHOTS,
    }}
  />
);
