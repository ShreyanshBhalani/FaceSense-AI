import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUpLeftFromCircleIcon, Image, ImageOff } from 'lucide-react';
// import { console } from 'inspector';

interface ImageUploadProps {
  onImageUpload: (imageDataUrl: string) => void; // Callback to send image data to parent
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  // console.log(imageRef,"IMAGE REF");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.match('image.*')) {
        alert('Please select a valid image file');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => {
        if (event.target?.result) {
          const imageDataUrl = event.target.result as string;
          console.log('Image Data URL from ImageUpload:', imageDataUrl);
          setImageUrl(imageDataUrl);

          // Pass the image data URL to the parent component
          onImageUpload(imageDataUrl);

          // Reset file input value to allow selecting the same file again
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };

      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImageUrl(null);
    onImageUpload(''); // Clear the image in the parent component
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
