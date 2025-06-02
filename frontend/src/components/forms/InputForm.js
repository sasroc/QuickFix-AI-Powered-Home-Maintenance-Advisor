import React, { useState, useRef } from 'react';
import './InputForm.css';

const InputForm = ({ onSubmit }) => {
  const [textInput, setTextInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (textInput.trim()) {
      onSubmit({
        type: 'text',
        content: textInput,
        image: selectedImage
      });
    }
  };

  const handleVoiceInput = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          onSubmit({
            type: 'voice',
            content: audioBlob,
            image: selectedImage
          });
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Error accessing microphone:', error);
      }
    } else {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
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
        <p className="repair-subtitle">Let's get your repair sorted</p>
      </div>

      <div className="repair-input-container">
        <form onSubmit={handleTextSubmit} className="unified-input-form">
          <div className="text-input-section">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Describe your repair issue in detail..."
              rows={4}
            />
            <div className="voice-input-button">
              <button
                type="button"
                className={isRecording ? 'recording' : ''}
                onClick={handleVoiceInput}
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
              <h3>Add Photo (Optional)</h3>
              <p>Upload a photo of the issue for better guidance</p>
            </div>
            
            <div className="image-upload-area">
              {selectedImage ? (
                <div className="image-preview-container">
                  <img src={URL.createObjectURL(selectedImage)} alt="Preview" />
                  <button
                    type="button"
                    className="remove-image"
                    onClick={removeImage}
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
                  />
                  <button
                    type="button"
                    className="upload-button"
                    onClick={() => fileInputRef.current.click()}
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

          <button type="submit" className="submit-button">
            Get Repair Guide
          </button>
        </form>
      </div>
    </div>
  );
};

export default InputForm; 