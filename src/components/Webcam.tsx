import React, { useRef, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff } from 'lucide-react';
import { setIsWebcamActive, setError } from '@/store/faceDetectionSlice';
import { RootState } from '@/store/store';

interface WebcamProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  onStream: (stream: MediaStream) => void;
}

const Webcam: React.FC<WebcamProps> = ({ videoRef, onStream }) => {
  const dispatch = useDispatch();
  const { isWebcamActive } = useSelector((state: RootState) => state.faceDetection);
  const [loading, setLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const startWebcam = async () => {
    setLoading(true);
    try {
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      dispatch(setIsWebcamActive(true));
      dispatch(setError(null));
      onStream(stream);
    } catch (error) {
      console.error('Error accessing webcam:', error);
      dispatch(setError('Failed to access webcam. Please ensure you have given permission.'));
    } finally {
      setLoading(false);
    }
  };

  const stopWebcam = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    if (stream) {
      // Capture the current frame before stopping the webcam
      captureImage();

      stream.getTracks().forEach((track) => track.stop());
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      dispatch(setIsWebcamActive(false));
    }
  };

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/png');
        setCapturedImage(imageData);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (isWebcamActive) {
        stopWebcam();
      }
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="webcam-container bg-gray-100 rounded-lg overflow-hidden shadow-md">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full max-h-[60vh] object-cover ${!isWebcamActive ? 'hidden' : ''}`}
        />
        {!isWebcamActive && !capturedImage && (
          <div className="flex items-center justify-center bg-gray-100 h-[60vh] w-full">
            <div className="text-center p-4">
              <CameraOff size={64} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-500">Camera is turned off</h3>
              <p className="text-sm text-gray-400 mt-2">
                Click the button below to activate your camera
              </p>
            </div>
          </div>
        )}
        {!isWebcamActive && capturedImage && (
          <div className="flex items-center justify-center bg-gray-100 h-[60vh] w-full">
            <img
              src={capturedImage}
              alt="Captured"
              className="object-contain max-h-full max-w-full"
            />
          </div>
        )}
      </div>
      <div className="flex justify-center">
        <Button
          onClick={isWebcamActive ? stopWebcam : startWebcam}
          disabled={loading}
          className={`gap-2 ${isWebcamActive ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
        >
          {loading ? (
            <>
              <span className="animate-pulse-light">Loading...</span>
            </>
          ) : (
            <>
              {isWebcamActive ? <CameraOff size={18} /> : <Camera size={18} />}
              {isWebcamActive ? 'Stop Camera' : 'Start Camera'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default Webcam;
