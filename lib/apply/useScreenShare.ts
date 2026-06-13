"use client";
// Lets the user share their screen/tab so the assistant can SEE the BenefitsCal
// page they're on. The page renders in a cross-origin iframe, so JS can't read
// its pixels directly — the Screen Capture API (getDisplayMedia) is the only way,
// and it requires explicit user permission. We hold the stream while "sharing"
// is on and grab a single JPEG frame on demand (captureFrame) to send to the
// vision model, instead of re-prompting for every question.
import { useCallback, useEffect, useRef, useState } from "react";

export function useScreenShare() {
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [sharing, setSharing] = useState(false);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    videoRef.current = null;
    setSharing(false);
  }, []);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 1 },
        audio: false,
        // Chrome hint: bias the picker toward this tab so the agent sees the app.
        preferCurrentTab: true,
      } as MediaStreamConstraints);
      streamRef.current = stream;
      const video = document.createElement("video");
      video.srcObject = stream;
      video.muted = true;
      await video.play();
      videoRef.current = video;
      // Reflect it in the UI if the user ends sharing from the browser's own bar.
      stream.getVideoTracks()[0]?.addEventListener("ended", stop);
      setSharing(true);
      return true;
    } catch {
      stop();
      return false;
    }
  }, [stop]);

  // Grab the current frame as a downscaled JPEG data URL (keeps tokens/payload
  // reasonable). Returns null if nothing is being shared yet.
  const captureFrame = useCallback(async (): Promise<string | null> => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;
    const maxW = 1400;
    const scale = Math.min(1, maxW / video.videoWidth);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.7);
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { sharing, start, stop, captureFrame };
}
