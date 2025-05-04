
// import React, { useRef, useState } from 'react';
// import { useSelector } from 'react-redux';
// import { RootState } from '@/store/store';
// import { Provider } from 'react-redux';
// import { store } from '@/store/store';
// import Webcam from '@/components/Webcam';
// import FaceDetection from '@/components/FaceDetection';
// import FaceCard from '@/components/FaceCard';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { Separator } from '@/components/ui/separator';
// import ImageUpload from '@/components/ImageUpload';
// import { DetectionSource } from '@/types/face';

// // Import needed to make things work with UUIDs
// // Removed unused uuidv4 import
// import { ArrowDown } from 'lucide-react';

// const FaceDetectionApp: React.FC = () => {
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const imageRef = useRef<HTMLImageElement>(null);
//   const { faces, isWebcamActive, error } = useSelector((state: RootState) => state.faceDetection);
//   const [detectionSource, setDetectionSource] = useState<DetectionSource | null>(null);
//   const handleStream = () => {
//     setDetectionSource(DetectionSource.WEBCAM);
//   };

//   const handleImageLoad = () => {
//     setDetectionSource(DetectionSource.UPLOAD);
//   };

//   const isDetectionActive = detectionSource !== null && 
//     ((detectionSource === DetectionSource.WEBCAM && isWebcamActive) || 
//      (detectionSource === DetectionSource.UPLOAD));

//   return (
//     <div className="container mx-auto py-6 px-4">
//       <header className="text-center mb-10">
//         <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-blue-700 text-transparent bg-clip-text inline-block">
//           FaceSense AI
//         </h1>
//         <p className="text-gray-600 mt-2">
//           Advanced facial recognition with real-time analysis
//         </p>
//       </header>

//       {error && (
//         <Alert variant="destructive" className="mb-6">
//           <AlertDescription>{error}</AlertDescription>
//         </Alert>
//       )}

//       <div className="grid md:grid-cols-3 gap-8">
//         <div className="md:col-span-2">
//           <div className="relative">
//             <h2 className="text-xl font-bold mb-4">Camera Feed</h2>
//             <Webcam videoRef={videoRef} onStream={handleStream} />
//             {detectionSource === DetectionSource.WEBCAM && (
//               <FaceDetection videoRef={videoRef} active={isWebcamActive} />
//             )}
//           </div>

//           <ImageUpload onImageUpload={handleImageLoad} />
//           {detectionSource === DetectionSource.UPLOAD && (
//             <div className="relative">
//               <ImageUpload
//                 onImageUpload={(imageElement) => {
//                   imageRef.current = imageElement;
//                   handleImageLoad();
//                 }}
//               />
//               {imageRef.current && (
//                 <div className="relative">
//                   <FaceDetection imageRef={imageRef} active={true} />
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//         <div className="md:col-span-1">
//           <div className="sticky top-4">
//             <h2 className="text-xl font-bold mb-4">Detected Faces</h2>
            
//             {faces.length > 0 ? (
//               <div className="space-y-4">
//                 {faces.map((face, index) => (
//                   <FaceCard key={face.id} face={face} index={index} />
//                 ))}
//               </div>
//             ) : isDetectionActive ? (
//               <div className="bg-blue-50 text-blue-800 p-4 rounded-lg">
//                 <p>Scanning for faces...</p>
//               </div>
//             ) : (
//               <div className="bg-gray-50 text-gray-500 p-4 rounded-lg">
//                 <p>No faces detected yet. Start the camera or upload an image.</p>
//                 <div className="flex justify-center mt-4">
//                   <ArrowDown className="animate-bounce text-blue-500" size={24} />
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
      
//       <Separator className="my-8" />
      
//       <footer className="text-center text-gray-500 text-sm pb-4">
//         <p>© 2023 FaceSense AI. Built with TensorFlow.js and React.</p>
//         <p className="mt-1">All processing is done locally on your device. No images are transmitted to any server.</p>
//       </footer>
//     </div>
//   );
// };

// const Index = () => {
//   return (
//     <Provider store={store}>
//       <FaceDetectionApp />
//     </Provider>
//   );
// };

// export default Index;
import React, { useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import Webcam from '@/components/Webcam';
import FaceDetection from '@/components/FaceDetection';
import FaceCard from '@/components/FaceCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import ImageUpload from '@/components/ImageUpload';
import { DetectionSource } from '@/types/face';
import { ArrowDown } from 'lucide-react';

const FaceDetectionApp: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { faces, isWebcamActive, error } = useSelector((state: RootState) => state.faceDetection);

  const [uploadedImageRef, setUploadedImageRef] = useState<HTMLImageElement | null>(null);
  const [detectionSource, setDetectionSource] = useState<DetectionSource | null>(null);

  const handleStream = () => {
    setDetectionSource(DetectionSource.WEBCAM);
  };

  const handleImageUpload = (imageDataUrl: string) => {
    const img = new Image();
    img.src = imageDataUrl;
    console.log('Image Data B64:', img.src);
    img.onload = () => {
      console.log('Image loaded:', img.width, img.height);
      setUploadedImageRef(img); // This ref is passed to <FaceDetection />
      setDetectionSource(DetectionSource.UPLOAD);
    };
  };

  const isDetectionActive = detectionSource !== null &&
    ((detectionSource === DetectionSource.WEBCAM && isWebcamActive) ||
     (detectionSource === DetectionSource.UPLOAD));

  return (
    <div className="container mx-auto py-6 px-4">
      <header className="text-center mb-10">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-blue-700 text-transparent bg-clip-text inline-block">
          FaceSense AI
        </h1>
        <p className="text-gray-600 mt-2">
          Advanced facial recognition with real-time analysis
        </p>
      </header>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="relative mb-8">
            <h2 className="text-xl font-bold mb-4">Camera Feed</h2>
            <Webcam videoRef={videoRef} onStream={handleStream} />
            {detectionSource === DetectionSource.WEBCAM && (
              <FaceDetection videoRef={videoRef} active={isWebcamActive} />
            )}
          </div>

          <ImageUpload onImageUpload={handleImageUpload} />
          {detectionSource === DetectionSource.UPLOAD && uploadedImageRef && (
            <div className="relative mt-4">
              <FaceDetection imageRef={{ current: uploadedImageRef }} active={true} />
            </div>
          )}
        </div>

        <div className="md:col-span-1">
          <div className="sticky top-4">
            <h2 className="text-xl font-bold mb-4">Detected Faces</h2>

            {faces.length > 0 ? (
              <div className="space-y-4">
                {faces.map((face, index) => (
                  <FaceCard key={face.id} face={face} index={index} />
                ))}
              </div>
            ) : isDetectionActive ? (
              <div className="bg-blue-50 text-blue-800 p-4 rounded-lg">
                <p>Scanning for faces...</p>
              </div>
            ) : (
              <div className="bg-gray-50 text-gray-500 p-4 rounded-lg">
                <p>No faces detected yet. Start the camera or upload an image.</p>
                <div className="flex justify-center mt-4">
                  <ArrowDown className="animate-bounce text-blue-500" size={24} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Separator className="my-8" />

      <footer className="text-center text-gray-500 text-sm pb-4">
        <p>© 2025 FaceSense AI. Built with TensorFlow.js and React.</p>
        <p className="mt-1">All processing is done locally on your device. No images are transmitted to any server.</p>
      </footer>
    </div>
  );
};

const Index = () => {
  return (
    <Provider store={store}>
      <FaceDetectionApp />
    </Provider>
  );
};

export default Index;
