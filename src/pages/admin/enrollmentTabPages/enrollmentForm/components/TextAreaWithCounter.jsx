import React from "react";
import "./TextAreaWithCounter.css";

/**
 * TextArea with character counter
 * @param {Object} props
 * @param {string} props.value - Current value
 * @param {function} props.onChange - Change handler
 * @param {string} props.placeholder - Placeholder text
 * @param {number} props.maxLength - Maximum character length (default: 2000)
 * @param {number} props.rows - Number of rows (default: 4)
 * @param {boolean} props.required - Whether field is required
 * @param {boolean} props.hasError - Whether field has validation error
 */
export default function TextAreaWithCounter({
  value = "",
  onChange,
  placeholder = "",
  maxLength = 2000,
  rows = 4,
  required = false,
  hasError = false,
  ...rest
}) {
  const charCount = value?.length || 0;
  const percentUsed = (charCount / maxLength) * 100;

  // Determine counter color based on usage
  const getCounterClass = () => {
    if (percentUsed >= 90) return "counter-danger";
    if (percentUsed >= 75) return "counter-warning";
    return "";
  };

  return (
    <div className="textarea-with-counter">
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        required={required}
        className={hasError ? "has-error" : ""}
        {...rest}
      />
      <div className={`char-counter ${getCounterClass()}`}>
        <span className="char-count">{charCount.toLocaleString()}</span>
        <span className="char-separator">/</span>
        <span className="char-max">{maxLength.toLocaleString()}</span>
        <span className="char-label"> characters</span>
      </div>
    </div>
  );
}
