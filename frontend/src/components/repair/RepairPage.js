import React, { useState } from 'react';
import InputForm from '../forms/InputForm';
import RepairGuide from './RepairGuide';
import { analyzeRepairIssue } from '../../services/aiService';
import SubscriptionGate from '../auth/SubscriptionGate';

function RepairPage() {
  const [repairData, setRepairData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (input) => {
    setIsLoading(true);
    try {
      // Call the backend AI service
      const aiResponse = await analyzeRepairIssue({
        description: input.text,
        image: input.image
      });

      // Map the AI response to the format expected by RepairGuide
      const mappedResponse = {
        title: input.text || 'Repair Guide',
        steps: Array.isArray(aiResponse.steps)
          ? aiResponse.steps.map((desc, idx) => ({ description: desc, image: null }))
          : [],
        tools: aiResponse.tools || [],
        materials: aiResponse.materials || [],
        estimatedTime: aiResponse.estimatedTime
          ? `${aiResponse.estimatedTime} minutes`
          : '',
        confidenceScore: aiResponse.confidenceScore || null,
        imageAnalysis: aiResponse.imageAnalysis || null
      };

      setRepairData(mappedResponse);
    } catch (error) {
      console.error('Error processing repair request:', error);
      // TODO: Add proper error handling/UI feedback
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SubscriptionGate>
      <div className="App">
        {!repairData ? (
          <InputForm onSubmit={handleSubmit} isLoading={isLoading} />
        ) : (
          <RepairGuide repairData={repairData} />
        )}
      </div>
    </SubscriptionGate>
  );
}

export default RepairPage; 