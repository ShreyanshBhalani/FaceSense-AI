import { useLayoutEffect } from 'react';
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
import { toast } from '@/hooks/use-toast';


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
        const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

        const loadingInterval = setInterval(() => {
          setLoadingProgress((prev) => (prev + 5 <= 80 ? prev + 5 : 80));
        }, 200);

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
          faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
        ]);

        clearInterval(loadingInterval);
        setLoadingProgress(100);
        dispatch(setIsModelLoaded(true));
        toast({ title: 'Models Loaded', description: 'Face detection models loaded successfully.' });

        setTimeout(() => setModelLoading(false), 500);
      } catch (error) {
        console.error('Error loading models:', error);
        dispatch(setError('Failed to load face detection models. Check console for details.'));
        toast({ title: 'Error', description: 'Failed to load face detection models.', variant: 'destructive' });
        setModelLoading(false);
      }
    };

    if (!isModelLoaded) loadModels();

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [dispatch, isModelLoaded]);

  // Periodic detection for webcam
  useEffect(() => {
    if (!isModelLoaded || !active) return;

    const detectFaces = async () => {
      const canvas = canvasRef.current;
      const mediaElement = videoRef?.current;

      if (!canvas || !mediaElement || mediaElement.paused || mediaElement.ended || !mediaElement.videoWidth) return;

      const displaySize = {
        width: mediaElement.clientWidth,
        height: mediaElement.clientHeight,
      };

      canvas.width = displaySize.width;
      canvas.height = displaySize.height;

      try {
        dispatch(setIsDetecting(true));

        const detections = await faceapi
          .detectAllFaces(mediaElement, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceExpressions()
          .withAgeAndGender();

        faceapi.matchDimensions(canvas, displaySize);
        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);

        // const faces = resizedDetections.map((d) => ({
        //   id: uuidv4(),
        //   boundingBox: {
        //     x: d.detection.box.x,
        //     y: d.detection.box.y,
        //     width: d.detection.box.width,
        //     height: d.detection.box.height,
        //   },
        //   landmarks: d.landmarks.positions.map((pos) => ({ x: pos.x, y: pos.y })),
        //   expressions: d.expressions,
        //   age: d.age,
        //   gender: d.gender,
        //   probability: d.genderProbability,
        // }));
        const faces = resizedDetections.map((d) => ({
          id: uuidv4(),
          boundingBox: {
            x: d.detection.box.x,
            y: d.detection.box.y,
            width: d.detection.box.width,
            height: d.detection.box.height,
          },
          landmarks: d.landmarks.positions.map((pos) => ({ x: pos.x, y: pos.y })),
          expressions: d.expressions.asSortedArray().reduce((acc, curr) => {
            acc[curr.expression] = curr.probability;
            return acc;
          }, {} as Record<string, number>),
          age: d.age,
          gender: d.gender,
          probability: d.genderProbability,
        }));


        dispatch(setFaces(faces));

        if (ctx) {
          faces.forEach((face, index) => {
            ctx.strokeStyle = '#2563EB';
            ctx.lineWidth = 2;
            ctx.strokeRect(face.boundingBox.x, face.boundingBox.y, face.boundingBox.width, face.boundingBox.height);
            ctx.fillStyle = '#2563EB';
            ctx.fillRect(face.boundingBox.x, face.boundingBox.y - 25, 80, 20);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '12px Inter';
            ctx.fillText(`Face #${index + 1}`, face.boundingBox.x + 5, face.boundingBox.y - 10);
            face.landmarks.forEach((landmark) => {
              ctx.fillStyle = '#3B82F6';
              ctx.beginPath();
              ctx.arc(landmark.x, landmark.y, 1, 0, 2 * Math.PI);
              ctx.fill();
            });
          });
        }
      } catch (error) {
        console.error('Webcam detection error:', error);
      } finally {
        dispatch(setIsDetecting(false));
      }
    };

    if (videoRef?.current) {
      detectionIntervalRef.current = window.setInterval(detectFaces, 200);
      detectFaces();
    }

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
    };
  }, [videoRef, isModelLoaded, active, dispatch]);


//Canvas ready issue with this useEffect
  // One-time detection for uploaded images
  // useEffect(() => {
  //   if (!imageRef?.current || !active || videoRef?.current) return;
  //   if (!isModelLoaded) return;
  //   console.log(isModelLoaded, 'isModelLoaded');
  //   const detectImage = async () => {
  //     const canvas = canvasRef.current;
  //     console.log('Canvas:', canvas);
  //     const img = imageRef.current;
  //     console.log('Image detection:', img.width,img.height);
  //     if (!canvas || !img) return;
  //     const displaySize = {
  //       width: img.width,
  //       height: img.height,
  //     };

  //     canvas.width = displaySize.width;
  //     canvas.height = displaySize.height;
  //     console.log('Canvas size:', canvas.width, canvas.height);

  //     try {
  //       dispatch(setIsDetecting(true));

  //       const detections = await faceapi
  //         .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
  //         .withFaceLandmarks()
  //         .withFaceExpressions()
  //         .withAgeAndGender();

  //       faceapi.matchDimensions(canvas, displaySize);
  //       const resizedDetections = faceapi.resizeResults(detections, displaySize);

  //       const ctx = canvas.getContext('2d');
  //       ctx?.clearRect(0, 0, canvas.width, canvas.height);

  //       // const faces = resizedDetections.map((d) => ({
  //       //   id: uuidv4(),
  //       //   boundingBox: {
  //       //     x: d.detection.box.x,
  //       //     y: d.detection.box.y,
  //       //     width: d.detection.box.width,
  //       //     height: d.detection.box.height,
  //       //   },
  //       //   landmarks: d.landmarks.positions.map((pos) => ({ x: pos.x, y: pos.y })),
  //       //   expressions: d.expressions,
  //       //   age: d.age,
  //       //   gender: d.gender,
  //       //   probability: d.genderProbability,
  //       // }));
  //       const faces = resizedDetections.map((d) => ({
  //         id: uuidv4(),
  //         boundingBox: {
  //           x: d.detection.box.x,
  //           y: d.detection.box.y,
  //           width: d.detection.box.width,
  //           height: d.detection.box.height,
  //         },
  //         landmarks: d.landmarks.positions.map((pos) => ({ x: pos.x, y: pos.y })),
  //         expressions: d.expressions.asSortedArray().reduce((acc, curr) => {
  //           acc[curr.expression] = curr.probability;
  //           return acc;
  //         }, {} as Record<string, number>),
  //         age: d.age,
  //         gender: d.gender,
  //         probability: d.genderProbability,
  //       }));

  //       dispatch(setFaces(faces));

  //       if (ctx) {
  //         faces.forEach((face, index) => {
  //           ctx.strokeStyle = '#2563EB';
  //           ctx.lineWidth = 2;
  //           ctx.strokeRect(face.boundingBox.x, face.boundingBox.y, face.boundingBox.width, face.boundingBox.height);
  //           ctx.fillStyle = '#2563EB';
  //           ctx.fillRect(face.boundingBox.x, face.boundingBox.y - 25, 80, 20);
  //           ctx.fillStyle = '#FFFFFF';
  //           ctx.font = '12px Inter';
  //           ctx.fillText(`Face #${index + 1}`, face.boundingBox.x + 5, face.boundingBox.y - 10);
  //           face.landmarks.forEach((landmark) => {
  //             ctx.fillStyle = '#3B82F6';
  //             ctx.beginPath();
  //             ctx.arc(landmark.x, landmark.y, 1, 0, 2 * Math.PI);
  //             ctx.fill();
  //           });
  //         });
  //       }
  //     } catch (err) {
  //       console.error('Image detection error:', err);
  //     } finally {
  //       dispatch(setIsDetecting(false));
  //     }
  //   };

  //   detectImage();
  // }, [imageRef?.current, isModelLoaded, active, videoRef]);


  useEffect(() => {
    if (!imageRef?.current || !active || videoRef?.current) return;
    if (!isModelLoaded) return;
  
    const timeout = setTimeout(() => {
      const detectImage = async () => {
        const canvas = canvasRef.current;
        const img = imageRef.current;
  
        if (!canvas || !img) {
          console.warn('Canvas or image not available for detection');
          return;
        }
  
        const displaySize = {
          width: img.width,
          height: img.height,
        };
  
        canvas.width = displaySize.width;
        canvas.height = displaySize.height;
  
        try {
          dispatch(setIsDetecting(true));
  
          const detections = await faceapi
            .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions()
            .withAgeAndGender();
  
          faceapi.matchDimensions(canvas, displaySize);
          const resizedDetections = faceapi.resizeResults(detections, displaySize);
  
          const ctx = canvas.getContext('2d');
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
  
          const faces = resizedDetections.map((d) => ({
            id: uuidv4(),
            boundingBox: {
              x: d.detection.box.x,
              y: d.detection.box.y,
              width: d.detection.box.width,
              height: d.detection.box.height,
            },
            landmarks: d.landmarks.positions.map((pos) => ({ x: pos.x, y: pos.y })),
            expressions: d.expressions.asSortedArray().reduce((acc, curr) => {
              acc[curr.expression] = curr.probability;
              return acc;
            }, {} as Record<string, number>),
            age: d.age,
            gender: d.gender,
            probability: d.genderProbability,
          }));
  
          dispatch(setFaces(faces));
  
          if (ctx) {
            faces.forEach((face, index) => {
              ctx.strokeStyle = '#2563EB';
              ctx.lineWidth = 2;
              ctx.strokeRect(face.boundingBox.x, face.boundingBox.y, face.boundingBox.width, face.boundingBox.height);
              ctx.fillStyle = '#2563EB';
              ctx.fillRect(face.boundingBox.x, face.boundingBox.y - 25, 80, 20);
              ctx.fillStyle = '#FFFFFF';
              ctx.font = '12px Inter';
              ctx.fillText(`Face #${index + 1}`, face.boundingBox.x + 5, face.boundingBox.y - 10);
              face.landmarks.forEach((landmark) => {
                ctx.fillStyle = '#3B82F6';
                ctx.beginPath();
                ctx.arc(landmark.x, landmark.y, 1, 0, 2 * Math.PI);
                ctx.fill();
              });
            });
          }
        } catch (err) {
          console.error('Image detection error:', err);
        } finally {
          dispatch(setIsDetecting(false));
        }
      };
  
      detectImage();
    }, 1000); // Delay ensures canvas is ready
  
    return () => clearTimeout(timeout);
  }, [imageRef?.current, isModelLoaded, active, videoRef]);
  
  

  
  if (modelLoading) {
    return (
      <div className="mt-4 flex flex-col items-center">
        <h3 className="text-lg font-medium text-gray-700 mb-2">Loading Face Detection Models...</h3>
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
        <p className="text-sm text-gray-500">Start the camera or upload an image to begin face detection</p>
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


