import React, { useState, useRef } from "react";

// Check if browser supports speech recognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const isSpeechSupported = !!SpeechRecognition;

export default function Step3PurposeOfAssessment({ data, onChange, errors = {} }) {
  const [listeningIndex, setListeningIndex] = useState(null);
  const recognitionRef = useRef(null);

  const handleAddPurpose = () => {
    onChange("purposeOfAssessment", [...data.purposeOfAssessment, ""]);
  };

  const handleRemovePurpose = (index) => {
    // Stop listening if removing the active input
    if (listeningIndex === index) {
      stopListening();
    }
    const newList = [...data.purposeOfAssessment];
    newList.splice(index, 1);
    onChange("purposeOfAssessment", newList);
  };

  const handlePurposeChange = (index, value) => {
    const newList = [...data.purposeOfAssessment];
    newList[index] = value;
    onChange("purposeOfAssessment", newList);
  };

  // Start speech recognition for a specific input
  const startListening = (index) => {
    if (!isSpeechSupported) {
      alert("Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const currentValue = data.purposeOfAssessment[index] || "";
      const newValue = currentValue ? `${currentValue} ${transcript}` : transcript;
      handlePurposeChange(index, newValue);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setListeningIndex(null);
    };

    recognition.onend = () => {
      setListeningIndex(null);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListeningIndex(index);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setListeningIndex(null);
  };

  const toggleListening = (index) => {
    if (listeningIndex === index) {
      stopListening();
    } else {
      startListening(index);
    }
  };

  return (
    <div className="form-section">
      <div className="section-header-flex">
        <h3>III. PURPOSE OF ASSESSMENT</h3>
      </div>

      <p className="field-hint">
        List the purposes of this assessment. Click 🎤 to dictate each point.
      </p>

      {errors.purposeOfAssessment && (
        <div className="field-error-message" style={{ marginBottom: '16px' }}>
          {errors.purposeOfAssessment}
        </div>
      )}

      <div className="dynamic-list-container">
        {(data.purposeOfAssessment.length > 0
          ? data.purposeOfAssessment
          : [""]
        ).map((purpose, index) => (
          <div
            className={`dynamic-input-row ${listeningIndex === index ? 'is-listening' : ''}`}
            key={index}
          >
            <span className="row-index">{index + 1}</span>
            <input
              type="text"
              placeholder="Enter purpose point..."
              value={purpose}
              onChange={(e) => handlePurposeChange(index, e.target.value)}
              required
              disabled={listeningIndex === index}
            />
            {isSpeechSupported && (
              <button
                type="button"
                className={`speech-input-btn ${listeningIndex === index ? 'listening' : ''}`}
                onClick={() => toggleListening(index)}
                title={listeningIndex === index ? "Stop dictation" : "Start dictation"}
              >
                🎤
              </button>
            )}
            {data.purposeOfAssessment.length > 1 && (
              <button
                type="button"
                className="remove-row-btn"
                onClick={() => handleRemovePurpose(index)}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      <button type="button" className="add-point-btn" onClick={handleAddPurpose}>
        + Add Assessment Purpose
      </button>
    </div>
  );
}
