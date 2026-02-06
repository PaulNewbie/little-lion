import React, { useState, useRef, useEffect } from "react";

// Check if browser supports speech recognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const isSpeechSupported = !!SpeechRecognition;

export default function SpeechToTextTextarea({
  value,
  onChange,
  placeholder,
  rows = 4,
  maxLength,
  required,
  disabled,
  className = "",
  hasError,
}) {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);

  // Initialize speech recognition
  useEffect(() => {
    if (!isSpeechSupported) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US"; // Can be made configurable

    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Show interim results
      setInterimText(interimTranscript);

      // Append final results to the value
      if (finalTranscript) {
        const newValue = value ? `${value} ${finalTranscript}` : finalTranscript;
        onChange({ target: { value: newValue } });
        setInterimText("");
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      setInterimText("");
    };

    recognition.onend = () => {
      // Restart if still listening (continuous mode)
      if (isListening && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          // Already started, ignore
        }
      } else {
        setIsListening(false);
        setInterimText("");
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [value, onChange, isListening]);

  // Toggle listening
  const toggleListening = () => {
    if (!isSpeechSupported) {
      alert("Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setInterimText("");
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.error("Failed to start speech recognition:", e);
      }
    }
  };

  // Stop listening when component unmounts or value changes externally
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return (
    <div className="speech-textarea-container">
      <div className="speech-textarea-wrapper">
        <textarea
          ref={textareaRef}
          rows={rows}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          maxLength={maxLength}
          required={required}
          disabled={disabled || isListening}
          className={`speech-textarea ${className} ${hasError ? "has-error" : ""} ${isListening ? "is-listening" : ""}`}
        />

        {/* Microphone Button */}
        <button
          type="button"
          className={`speech-mic-btn ${isListening ? "listening" : ""}`}
          onClick={toggleListening}
          disabled={disabled}
          title={isListening ? "Stop dictation" : "Start dictation"}
        >
          {isListening ? (
            <span className="mic-icon listening">
              <span className="mic-pulse"></span>
              🎤
            </span>
          ) : (
            <span className="mic-icon">🎤</span>
          )}
        </button>
      </div>

      {/* Interim text indicator */}
      {isListening && (
        <div className="speech-status">
          <span className="listening-indicator">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </span>
          <span className="listening-text">
            {interimText || "Listening..."}
          </span>
        </div>
      )}

      {/* Browser support warning */}
      {!isSpeechSupported && (
        <div className="speech-unsupported">
          Voice input not supported in this browser
        </div>
      )}
    </div>
  );
}
