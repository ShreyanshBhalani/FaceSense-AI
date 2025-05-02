
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FaceDetection, FaceDetectionState } from '@/types/face';

const initialState: FaceDetectionState = {
  faces: [],
  isDetecting: false,
  isWebcamActive: false,
  isModelLoaded: false,
  error: null,
};

export const faceDetectionSlice = createSlice({
  name: 'faceDetection',
  initialState,
  reducers: {
    setFaces: (state, action: PayloadAction<FaceDetection[]>) => {
      state.faces = action.payload;
    },
    setIsDetecting: (state, action: PayloadAction<boolean>) => {
      state.isDetecting = action.payload;
    },
    setIsWebcamActive: (state, action: PayloadAction<boolean>) => {
      state.isWebcamActive = action.payload;
    },
    setIsModelLoaded: (state, action: PayloadAction<boolean>) => {
      state.isModelLoaded = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearFaces: (state) => {
      state.faces = [];
    },
  },
});

export const {
  setFaces,
  setIsDetecting,
  setIsWebcamActive,
  setIsModelLoaded,
  setError,
  clearFaces,
} = faceDetectionSlice.actions;

export default faceDetectionSlice.reducer;
