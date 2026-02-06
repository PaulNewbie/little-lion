import React, { useState, useRef } from "react";
import SpeechToTextTextarea from "./SpeechToTextTextarea";

// Check if browser supports speech recognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const isSpeechSupported = !!SpeechRecognition;

export default function Step8SummaryRecommendations({ data, onChange, errors = {} }) {
  const [listeningIndex, setListeningIndex] = useState(null);
  const recognitionRef = useRef(null);

  // Initialize recommendations array if not present
  const recommendations = data.recommendations || [""];

  // Add new recommendation
  const handleAddRecommendation = () => {
    onChange("recommendations", null, [...recommendations, ""]);
  };

  // Remove recommendation
  const handleRemoveRecommendation = (index) => {
    if (listeningIndex === index) {
      stopListening();
    }
    const newRecommendations = recommendations.filter((_, i) => i !== index);
    onChange("recommendations", null, newRecommendations);
  };

  // Update recommendation
  const handleRecommendationChange = (index, value) => {
    const newRecommendations = [...recommendations];
    newRecommendations[index] = value;
    onChange("recommendations", null, newRecommendations);
  };

  // Speech recognition functions
  const startListening = (index) => {
    if (!isSpeechSupported) {
      alert("Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const currentValue = recommendations[index] || "";
      const newValue = currentValue ? `${currentValue} ${transcript}` : transcript;
      handleRecommendationChange(index, newValue);
    };

    recognition.onerror = () => setListeningIndex(null);
    recognition.onend = () => setListeningIndex(null);

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
      <h3>VIII. SUMMARY AND RECOMMENDATIONS</h3>

      {/* SUMMARY */}
      <div className={`assessment-result-block ${errors.assessmentSummary ? 'has-error' : ''}`}>
        <h4 className="assessment-result-title">Summary *</h4>
        <p className="field-hint">
          Overall assessment findings and conclusions. Click 🎤 to dictate.
        </p>
        <SpeechToTextTextarea
          rows={6}
          placeholder="Enter overall assessment summary - key findings, strengths identified, areas of concern..."
          value={data.assessmentSummary}
          onChange={(e) => onChange("assessmentSummary", null, e.target.value)}
          required
          hasError={!!errors.assessmentSummary}
        />
        {errors.assessmentSummary && (
          <div className="field-error-message">{errors.assessmentSummary}</div>
        )}
      </div>

      {/* RECOMMENDATIONS - Simple list like Purpose of Assessment */}
      <div className="form-section-group" style={{ marginTop: "24px" }}>
        <h4 className="subsection-title">Recommendations</h4>
        <p className="field-hint">
          List specific recommendations based on the assessment. Click 🎤 to dictate.
        </p>

        {errors.recommendations && (
          <div className="field-error-message" style={{ marginBottom: '16px' }}>
            {errors.recommendations}
          </div>
        )}

        <div className="dynamic-list-container">
          {(recommendations.length > 0 ? recommendations : [""]).map((rec, index) => (
            <div
              className={`dynamic-input-row ${listeningIndex === index ? 'is-listening' : ''}`}
              key={index}
            >
              <span className="row-index">{index + 1}</span>
              <input
                type="text"
                placeholder="Enter recommendation..."
                value={rec}
                onChange={(e) => handleRecommendationChange(index, e.target.value)}
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
              {recommendations.length > 1 && (
                <button
                  type="button"
                  className="remove-row-btn"
                  onClick={() => handleRemoveRecommendation(index)}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        <button type="button" className="add-point-btn" onClick={handleAddRecommendation}>
          + Add Recommendation
        </button>
      </div>
    </div>
  );
}
