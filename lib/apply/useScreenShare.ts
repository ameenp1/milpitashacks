"use client";
// Lets the user share their screen/tab so the assistant can SEE the BenefitsCal
// page they're on. The page renders in a cross-origin iframe, so JS can't read
// its pixels directly — the Screen Capture API (getDisplayMedia) is the only way,
// and it requires explicit user permission. We hold the stream while "sharing"
// is on and grab a single JPEG frame on demand (captureFrame) to send to the
// vision model, instead of re-prompting for every question.
import { useCallback, useEffect, useRef, useState } from "react";

// Encode a source the canvas can draw (ImageBitmap or a ready <video>) to JPEG.
function toJpeg(source: CanvasImageSource, w: number, h: number): string | null {
  const maxW = 1400;
  const scale = Math.min(1, maxW / w);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.7);
}

export function useScreenShare() {
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [sharing, setSharing] = useState(false);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.remove();
      videoRef.current = null;
    }
    setSharing(false);
  }, []);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 5 },
        audio: false,
        // Chrome hint: bias the picker toward this tab so the agent sees the app.
        preferCurrentTab: true,
      } as MediaStreamConstraints);
      streamRef.current = stream;

      // Keep a hidden but RENDERED video (display:none would stop it decoding
      // frames, which breaks the canvas fallback). This is the capture source.
      const video = document.createElement("video");
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      video.style.cssText =
        "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:-10px;top:-10px;";
      document.body.appendChild(video);
      await video.play().catch(() => {});
      // Wait for real dimensions before we let anyone capture.
      if (!video.videoWidth) {
        await new Promise<void>((res) => {
          const done = () => res();
          video.addEventListener("loadedmetadata", done, { once: true });
          setTimeout(done, 1500);
        });
      }
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

  // Grab the current frame as a downscaled JPEG data URL. Prefers ImageCapture
  // (grabs straight off the track, most reliable), falling back to the video
  // element. Returns null only if nothing is being shared.
  const captureFrame = useCallback(async (): Promise<string | null> => {
    const stream = streamRef.current;
    const track = stream?.getVideoTracks()[0];
    if (!track || track.readyState !== "live") return null;

    // Primary: ImageCapture.grabFrame (Chromium). Not in the TS lib by default.
    const ImageCaptureCtor = (
      window as unknown as { ImageCapture?: new (t: MediaStreamTrack) => { grabFrame: () => Promise<ImageBitmap> } }
    ).ImageCapture;
    if (ImageCaptureCtor) {
      try {
        const bitmap = await new ImageCaptureCtor(track).grabFrame();
        const out = toJpeg(bitmap, bitmap.width, bitmap.height);
        bitmap.close?.();
        if (out) return out;
      } catch {
        /* fall through to the video path */
      }
    }

    // Fallback: draw the live <video>.
    const video = videoRef.current;
    for (let i = 0; i < 10 && (!video || !video.videoWidth); i++) {
      await new Promise((r) => setTimeout(r, 100));
    }
    if (!video || !video.videoWidth) return null;
    // Wait for an actually-painted frame so we don't capture a black one.
    const rvfc = (
      video as HTMLVideoElement & {
        requestVideoFrameCallback?: (cb: () => void) => number;
      }
    ).requestVideoFrameCallback?.bind(video);
    if (rvfc) {
      await new Promise<void>((res) => {
        rvfc(() => res());
        setTimeout(res, 400);
      });
    }
    return toJpeg(video, video.videoWidth, video.videoHeight);
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { sharing, start, stop, captureFrame };
}
