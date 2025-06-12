import React, { useState, useRef } from 'react';
import './InputForm.css';

const InputForm = ({ onSubmit, isLoading, disabled }) => {
  const [textInput, setTextInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (textInput.trim()) {
      onSubmit({ text: textInput.trim(), image: selectedImage });
    }
  };

  const handleVoiceInput = () => {
    if (!isRecording) {
      // Start recording
      setIsRecording(true);
      // TODO: Implement voice recording functionality
      setTimeout(() => setIsRecording(false), 3000); // Temporary simulation
    } else {
      // Stop recording
      setIsRecording(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="repair-page">
      <div className="repair-header">
        <h1 className="app-title">
          <span className="title-quick">Quick</span>
          <span className="title-fix">Fix</span>
          <span className="title-ai">AI</span>
        </h1>
        <p className="repair-subtitle">Your AI-powered home maintenance companion</p>
      </div>

      <div className="repair-input-container">
        <div className="input-header">
          <h2>Describe Your Repair Issue</h2>
          <p>Tell us what needs fixing, and we'll provide you with a detailed repair guide</p>
        </div>

        <form onSubmit={handleTextSubmit} className="unified-input-form">
          <div className="input-sections-container">
            <div className="text-input-section">
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="For example: My kitchen sink is leaking from under the cabinet. I can see water pooling on the floor..."
                rows={4}
                disabled={isLoading || disabled}
              />
              <div className="voice-input-button">
                <button
                  type="button"
                  className={isRecording ? 'recording' : ''}
                  onClick={handleVoiceInput}
                  disabled={isLoading || disabled}
                >
                  {isRecording ? (
                    <>
                      <span className="recording-dot"></span>
                      Recording...
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="23" />
                        <line x1="8" y1="23" x2="16" y2="23" />
                      </svg>
                      Record Voice
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="image-upload-section">
              <div className="image-upload-header">
                <h3>Add a Photo (Optional)</h3>
                <p>Upload a photo of the issue for better analysis</p>
              </div>
              <div 
                className="image-upload-area"
                onClick={() => !selectedImage && fileInputRef.current?.click()}
              >
                {selectedImage ? (
                  <div className="image-preview-container">
                    <img src={selectedImage} alt="Upload preview" />
                    <button
                      type="button"
                      className="remove-image"
                      onClick={removeImage}
                      disabled={isLoading || disabled}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      style={{ display: 'none' }}
                      disabled={isLoading || disabled}
                    />
                    <button
                      type="button"
                      className="upload-button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading || disabled}
                    >
                      <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      Upload Photo
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="submit-button-container">
            <button 
              type="submit" 
              className="submit-button"
              disabled={isLoading || disabled || !textInput.trim()}
            >
              {isLoading ? (
                <>
                  <span className="loading-spinner"></span>
                  Processing...
                </>
              ) : (
                'Get Repair Guide'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InputForm; 