
import React, { useRef, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as faceapi from 'face-api.js';
import { RootState } from '@/store/store';
import {
  setFaces,
  setIsDetecting,
  setIsModelLoaded,
  setError,
} from '@/store/faceDetectionSlice';
import { FaceDetection as FaceDetectionType } from '@/types/face';
import { v4 as uuidv4 } from 'uuid';
import { Progress } from '@/components/ui/progress';
import { ImageOff } from 'lucide-react';

interface FaceDetectionProps {
  videoRef?: React.RefObject<HTMLVideoElement>;
  imageRef?: React.RefObject<HTMLImageElement>;
  active: boolean;
}

const FaceDetection: React.FC<FaceDetectionProps> = ({ videoRef, imageRef, active }) => {
  const dispatch = useDispatch();
  const { isModelLoaded } = useSelector((state: RootState) => state.faceDetection);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [modelLoading, setModelLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const detectionIntervalRef = useRef<number | null>(null);

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        setModelLoading(true);
        const MODEL_URL = '/models';
        
        // Simulate loading progress
        const loadingInterval = setInterval(() => {
          setLoadingProgress(prev => {
            const newProgress = prev + 5;
            return newProgress <= 80 ? newProgress : 80;
          });
        }, 200);
        
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
          faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL)
        ]);
        
        clearInterval(loadingInterval);
        setLoadingProgress(100);
        
        dispatch(setIsModelLoaded(true));
        console.log('Face detection models loaded');
        
        setTimeout(() => {
          setModelLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error loading models:', error);
        dispatch(setError('Failed to load face detection models.'));
        setModelLoading(false);
      }
    };

    if (!isModelLoaded) {
      loadModels();
    }
    
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [dispatch, isModelLoaded]);

  // Face detection logic
  useEffect(() => {
    if (!isModelLoaded || !active) return;

    const detectFaces = async () => {
      if (!canvasRef.current) return;
      
      const canvas = canvasRef.current;
      const displaySize = { 
        width: canvas.width, 
        height: canvas.height 
      };
      
      let mediaElement: HTMLVideoElement | HTMLImageElement | null = null;
      
      if (videoRef?.current) {
        mediaElement = videoRef.current;
      } else if (imageRef?.current) {
        mediaElement = imageRef.current;
      }
      
      if (!mediaElement || !displaySize.width || !displaySize.height) return;
      
      try {
        dispatch(setIsDetecting(true));
        
        // Detect faces with all parameters
        const detections = await faceapi
          .detectAllFaces(mediaElement, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceExpressions()
          .withAgeAndGender();
        
        // Match canvas to media element dimensions
        faceapi.matchDimensions(canvas, displaySize);
        
        // Resize detections to match canvas dimensions
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        
        // Clear previous drawings
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        // Map to our face type and dispatch to Redux
        const faces: FaceDetectionType[] = resizedDetections.map(detection => {
          const { age, gender, genderProbability } = detection;
          return {
            id: uuidv4(),
            boundingBox: {
              x: detection.detection.box.x,
              y: detection.detection.box.y,
              width: detection.detection.box.width,
              height: detection.detection.box.height
            },
            landmarks: detection.landmarks.positions.map(position => ({
              x: position.x,
              y: position.y
            })),
            expressions: detection.expressions,
            age,
            gender,
            probability: genderProbability
          };
        });
        
        dispatch(setFaces(faces));
        
        // Draw detections on canvas
        faces.forEach((face, index) => {
          // Draw detection box
          ctx?.strokeRect(
            face.boundingBox.x,
            face.boundingBox.y,
            face.boundingBox.width,
            face.boundingBox.height
          );
          
          // Draw label
          ctx?.fillStyle = '#2563EB';
          ctx?.fillRect(
            face.boundingBox.x,
            face.boundingBox.y - 25,
            80,
            20
          );
          
          ctx?.fillStyle = '#FFFFFF';
          ctx?.font = '12px Inter';
          ctx?.fillText(
            `Face #${index + 1}`,
            face.boundingBox.x + 5,
            face.boundingBox.y - 10
          );
          
          // Draw landmarks
          if (face.landmarks) {
            face.landmarks.forEach(landmark => {
              ctx?.fillStyle = '#3B82F6';
              ctx?.beginPath();
              ctx?.arc(landmark.x, landmark.y, 1, 0, 2 * Math.PI);
              ctx?.fill();
            });
          }
        });
      } catch (error) {
        console.error('Error in face detection:', error);
      } finally {
        dispatch(setIsDetecting(false));
      }
    };

    if (videoRef?.current) {
      // For video, run detection on an interval
      detectionIntervalRef.current = window.setInterval(detectFaces, 200);
    } else if (imageRef?.current) {
      // For image, run detection once when active changes to true
      detectFaces();
    }

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
    };
  }, [videoRef, imageRef, isModelLoaded, active, dispatch]);

  // Handle canvas resize on window resize
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current) return;
      
      const canvas = canvasRef.current;
      let mediaElement: HTMLVideoElement | HTMLImageElement | null = null;
      
      if (videoRef?.current) {
        mediaElement = videoRef.current;
      } else if (imageRef?.current) {
        mediaElement = imageRef.current;
      }
      
      if (mediaElement) {
        canvas.width = mediaElement.clientWidth;
        canvas.height = mediaElement.clientHeight;
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [videoRef, imageRef]);

  if (modelLoading) {
    return (
      <div className="mt-4 flex flex-col items-center">
        <h3 className="text-lg font-medium text-gray-700 mb-2">
          Loading Face Detection Models...
        </h3>
        <div className="w-full max-w-xs mb-2">
          <Progress value={loadingProgress} className="h-2" />
        </div>
        <p className="text-sm text-gray-500">
          {loadingProgress === 100 ? 'Models loaded successfully!' : `${loadingProgress}% complete`}
        </p>
      </div>
    );
  }

  if (!active && !modelLoading) {
    return (
      <div className="mt-4 flex flex-col items-center">
        <ImageOff size={32} className="text-gray-400 mb-2" />
        <p className="text-sm text-gray-500">
          Start the camera or upload an image to begin face detection
        </p>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full"
      style={{ pointerEvents: 'none' }}
    />
  );
};

export default FaceDetection;
