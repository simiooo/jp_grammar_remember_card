import { useState, useEffect, useRef, useCallback } from 'react';
import { GestureRecognizer, FilesetResolver } from '@mediapipe/tasks-vision';

interface UseGestureRecognitionProps {
  onThumbUp?: () => void;
  onThumbDown?: () => void;
  enabled?: boolean;
  confidenceThreshold?: number;
  debounceMs?: number;
}

export const useGestureRecognition = ({
  onThumbUp,
  onThumbDown,
  enabled = true,
  confidenceThreshold = 0.5,
  debounceMs = 1000
}: UseGestureRecognitionProps) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGesture, setLastGesture] = useState<string | null>(null);
  
  const gestureRecognizerRef = useRef<GestureRecognizer | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const lastGestureTimeRef = useRef<number>(0);
  const lastGestureNameRef = useRef<string>('');

  const initializeGestureRecognizer = useCallback(async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      const gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-tasks/gesture_recognizer/gesture_recognizer.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.7,
        minHandPresenceConfidence: 0.7,
        minTrackingConfidence: 0.7,
      });

      gestureRecognizerRef.current = gestureRecognizer;
      setIsInitialized(true);
      setError(null);
    } catch (err) {
      console.error('Failed to initialize gesture recognizer:', err);
      console.log(err)
      setError('手势识别初始化失败');
      setIsInitialized(false);
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: 'user'
        }
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => resolve();
          }
        });
      }

      return true;
    } catch (err) {
      console.error('Failed to access camera:', err);
      setError('无法访问摄像头');
      return false;
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const detectGestures = useCallback(() => {
    if (!gestureRecognizerRef.current || !videoRef.current || !isDetecting) {
      return;
    }

    const video = videoRef.current;
    const gestureRecognizer = gestureRecognizerRef.current;

    if (video.currentTime !== lastVideoTimeRef.current) {
      const results = gestureRecognizer.recognizeForVideo(video, performance.now());
      
      if (results.gestures && results.gestures.length > 0) {
        const gesture = results.gestures[0][0];
        const gestureName = gesture.categoryName;
        const confidence = gesture.score;

        if (confidence >= confidenceThreshold) {
          const now = Date.now();
          const timeSinceLastGesture = now - lastGestureTimeRef.current;
          const isSameGesture = lastGestureNameRef.current === gestureName;
          
          // 去抖：如果相同手势在去抖时间内，则跳过
          if (!isSameGesture || timeSinceLastGesture >= debounceMs) {
            setLastGesture(gestureName);
            lastGestureTimeRef.current = now;
            lastGestureNameRef.current = gestureName;
            
            if (gestureName === 'Thumb_Up' && onThumbUp) {
              onThumbUp();
            } else if (gestureName === 'Thumb_Down' && onThumbDown) {
              onThumbDown();
            }
          }
        }
      }

      lastVideoTimeRef.current = video.currentTime;
    }

    if (isDetecting) {
      requestAnimationFrame(detectGestures);
    }
  }, [isDetecting, onThumbUp, onThumbDown, confidenceThreshold, debounceMs]);

  const startDetection = useCallback(async () => {
    if (!isInitialized) {
      await initializeGestureRecognizer();
    }

    const cameraStarted = await startCamera();
    if (cameraStarted) {
      setIsDetecting(true);
    }
  }, [isInitialized, initializeGestureRecognizer, startCamera]);

  const stopDetection = useCallback(() => {
    setIsDetecting(false);
    stopCamera();
  }, [stopCamera]);

  useEffect(() => {
    if (enabled && !isInitialized) {
      initializeGestureRecognizer();
    }

    return () => {
      stopDetection();
      if (gestureRecognizerRef.current) {
        gestureRecognizerRef.current.close();
      }
    };
  }, [enabled, isInitialized, initializeGestureRecognizer, stopDetection]);

  useEffect(() => {
    if (isDetecting) {
      detectGestures();
    }
  }, [isDetecting, detectGestures]);

  return {
    isInitialized,
    isDetecting,
    error,
    lastGesture,
    videoRef,
    startDetection,
    stopDetection
  };
};