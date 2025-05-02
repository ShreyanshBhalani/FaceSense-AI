
export interface FaceDetection {
  id: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  landmarks?: Array<{ x: number; y: number }>;
  expressions?: {
    neutral?: number;
    happy?: number;
    sad?: number;
    angry?: number;
    fearful?: number;
    disgusted?: number;
    surprised?: number;
  };
  gender?: string;
  age?: number;
  probability?: number;
}

export interface FaceDetectionState {
  faces: FaceDetection[];
  isDetecting: boolean;
  isWebcamActive: boolean;
  isModelLoaded: boolean;
  error: string | null;
}

export enum DetectionSource {
  WEBCAM = 'webcam',
  UPLOAD = 'upload'
}
