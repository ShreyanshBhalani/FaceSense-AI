
# Face API Models

This directory should contain the face-api.js model files if you want to use local models.

However, the application is currently configured to load models from GitHub:
https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights

If you want to use local models instead, you can download them from:
https://github.com/justadudewhohacks/face-api.js/tree/master/weights

Place the following files in this directory:
- age_gender_model-shard1
- age_gender_model-weights_manifest.json
- face_expression_model-shard1
- face_expression_model-weights_manifest.json
- face_landmark_68_model-shard1
- face_landmark_68_model-weights_manifest.json
- face_recognition_model-shard1
- face_recognition_model-shard2
- face_recognition_model-weights_manifest.json
- tiny_face_detector_model-shard1
- tiny_face_detector_model-weights_manifest.json

And then update the FaceDetection.tsx file to use local models by changing the MODEL_URL from the CDN to '/models'.
