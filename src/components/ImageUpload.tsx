
import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useDispatch } from 'react-redux';
import { clearFaces, setError } from '@/store/faceDetectionSlice';
import { Image, ImageOff } from 'lucide-react';

interface ImageUploadProps {
  onImageLoad: (imageElement: HTMLImageElement) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageLoad }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const dispatch = useDispatch();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file) {
      if (!file.type.match('image.*')) {
        dispatch(setError('Please select an image file'));
        return;
      }

      const reader = new FileReader();
      
      reader.onload = (event: ProgressEvent<FileReader>) => {
        if (event.target?.result) {
          setImageUrl(event.target.result as string);
          
          // Reset file input value to allow selecting the same file again
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          
          // Clear previous faces
          dispatch(clearFaces());
          
          // Pass image element to parent when loaded
          if (imageRef.current) {
            imageRef.current.onload = () => {
              if (imageRef.current) {
                onImageLoad(imageRef.current);
              }
            };
          }
        }
      };

      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImageUrl(null);
    dispatch(clearFaces());
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="mt-8 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Or Upload an Image</h2>
        {imageUrl && (
          <Button variant="outline" size="sm" onClick={clearImage} className="gap-2">
            <ImageOff size={16} />
            Clear
          </Button>
        )}
      </div>
      
      <div className="webcam-container bg-gray-100 rounded-lg overflow-hidden shadow-md">
        {imageUrl ? (
          <div style={{ position: 'relative' }}>
            <img 
              ref={imageRef}
              src={imageUrl} 
              alt="Uploaded" 
              className="w-full h-full object-contain"
              style={{ maxHeight: '60vh' }}
            />
          </div>
        ) : (
          <div 
            className="flex flex-col items-center justify-center cursor-pointer p-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg h-[300px]" 
            onClick={triggerFileInput}
          >
            <Image size={48} className="text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-500">Click to upload an image</p>
            <p className="text-sm text-gray-400 mt-2">
              JPG, PNG, WEBP formats supported
            </p>
          </div>
        )}
      </div>
      
      <div className="flex justify-center">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageChange}
          accept="image/*"
          className="hidden"
        />
        
        <Button
          onClick={triggerFileInput}
          className="gap-2 bg-blue-500 hover:bg-blue-600"
        >
          <Image size={18} />
          Upload Image
        </Button>
      </div>
    </div>
  );
};

export default ImageUpload;
