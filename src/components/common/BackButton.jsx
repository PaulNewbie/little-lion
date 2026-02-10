import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './BackButton.css';

/**
 * BackButton - Unified back navigation button used across all pages
 * Yellow gradient style matching the Little Lions brand
 *
 * @param {Object} props
 * @param {Function} [props.onClick] - Custom click handler (overrides default navigate(-1))
 * @param {string} [props.to] - Specific route to navigate to (overrides default navigate(-1))
 * @param {string} [props.className] - Additional CSS class names
 */
const BackButton = ({ onClick, to, className = '' }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`back-btn ${className}`}
      aria-label="Go back"
    >
      <ArrowLeft size={24} strokeWidth={2.5} />
    </button>
  );
};

export default BackButton;
