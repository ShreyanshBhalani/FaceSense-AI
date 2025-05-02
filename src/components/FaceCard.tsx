
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FaceDetection } from '@/types/face';

interface FaceCardProps {
  face: FaceDetection;
  index: number;
}

const FaceCard: React.FC<FaceCardProps> = ({ face, index }) => {
  // Determine the most likely expression
  const getTopExpression = () => {
    if (!face.expressions) return 'Unknown';
    
    let topExpression = 'neutral';
    let topScore = face.expressions.neutral || 0;
    
    Object.entries(face.expressions).forEach(([expression, score]) => {
      if (score && score > topScore) {
        topExpression = expression;
        topScore = score;
      }
    });
    
    return topExpression.charAt(0).toUpperCase() + topExpression.slice(1);
  };

  const topExpression = getTopExpression();
  const confidence = Math.round((face.probability || 0) * 100);

  return (
    <Card className="w-full animate-fade-in">
      <CardHeader className="py-3">
        <CardTitle className="text-md flex items-center justify-between">
          <span>Face #{index + 1}</span>
          <span className="text-sm font-normal text-blue-600">{confidence}% confidence</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Age</span>
            <span className="font-medium">{face.age !== undefined ? `~${Math.round(face.age)}` : 'Unknown'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Gender</span>
            <span className="font-medium">{face.gender || 'Unknown'}</span>
          </div>
          <div className="flex flex-col col-span-2">
            <span className="text-sm text-gray-500">Expression</span>
            <span className="font-medium">{topExpression}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FaceCard;
