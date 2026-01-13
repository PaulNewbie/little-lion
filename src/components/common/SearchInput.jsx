import React from 'react';
import './SearchInput.css';

/**
 * Reusable SearchInput Component
 * @param {Object} props
 * @param {string} props.value - Input value
 * @param {Function} props.onChange - Change handler
 * @param {string} [props.placeholder='Search...'] - Placeholder text
 * @param {boolean} [props.disabled=false] - Whether the input is disabled
 * @param {string} [props.className] - Additional CSS classes
 */
const SearchInput = ({
  value,
  onChange,
  placeholder = 'Search...',
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <div className={`search-input-container ${className}`}>
      <svg
        className="search-input__icon"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
      </svg>
      <input
        type="text"
        className="search-input"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        {...props}
      />
      {value && (
        <button
          className="search-input__clear"
          onClick={() => onChange({ target: { value: '' } })}
          type="button"
          aria-label="Clear search"
        >
          &times;
        </button>
      )}
    </div>
  );
};

export default SearchInput;
