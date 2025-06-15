import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import RepairGuide from './RepairGuide';
import './HistoricalRepairView.css';

function HistoricalRepairView() {
  const location = useLocation();
  const navigate = useNavigate();
  const { repairData } = location.state || {};

  if (!repairData) {
    return (
      <div className="historical-repair-container">
        <div className="error-message">
          <h2>Repair Not Found</h2>
          <p>The repair you're looking for could not be found.</p>
          <button 
            className="back-button"
            onClick={() => navigate('/repair/history')}
          >
            Back to History
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="historical-repair-container">
      <div className="historical-repair-header">
        <button 
          className="back-button"
          onClick={() => navigate('/repair/history')}
        >
          ← Back to History
        </button>
        <h2>Historical Repair Guide</h2>
      </div>
      <RepairGuide repairData={repairData} isHistorical={true} />
    </div>
  );
}

export default HistoricalRepairView; 