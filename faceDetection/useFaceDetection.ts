import { useCallback, useEffect, useState } from "react";
import * as faceapi from "@vladmandic/face-api";

export const useDetectFace = (
  videoElement: any,
  intervalSeconds: number,
  userMinutesAlert: number,
  allowBorderDebug: boolean
) => {
  const [lastSeen, setLastSeen] = useState<number>(Date.now());
  const [isTimePassed, setIsTimePassed] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);

  const resetLastSeen = useCallback(() => {
    setLastSeen(Date.now());
  }, []);

  const detect = useCallback(async () => {
    if (!videoElement || !modelLoaded) {
      return;
    }

    const results = await faceapi?.detectAllFaces(videoElement.video);

    // user is in: set current time to last seen
    if (results.length) resetLastSeen();

    // time before alert passed: isTimePassed = true -> display alert
    const isTimePassed = Date.now() > lastSeen + userMinutesAlert * 60000;
    setIsTimePassed(isTimePassed);

    if (allowBorderDebug) {
      const color = isTimePassed ? "red" : results.length ? "green" : "orange";
      videoElement.video.style.border = `5px solid ${color}`;
    }
  }, [lastSeen, modelLoaded, resetLastSeen, videoElement, userMinutesAlert]);

  useEffect(() => {
    const load = async () => {
      await faceapi.nets.ssdMobilenetv1
        .loadFromUri("model")
        .then(() => setModelLoaded(true));
    };

    load().catch(console.error);
  }, [modelLoaded]);

  useEffect(() => {
    const detectionInterval = setInterval(
      () => detect(),
      intervalSeconds * 1000
    );

    return () => {
      clearInterval(detectionInterval);
    };
  }, [detect, videoElement]);

  return isTimePassed;
};
