import React from 'react';

const QuickSelectTags = ({ label, options, selected = [], onChange, multiSelect = true, color = 'blue' }) => {
  
  const handleToggle = (option) => {
    if (multiSelect) {
      if (selected.includes(option)) {
        onChange(selected.filter(item => item !== option));
      } else {
        onChange([...selected, option]);
      }
    } else {
      // Single select toggle
      onChange(selected.includes(option) ? [] : [option]);
    }
  };

  const getColor = (c) => {
    const colors = {
      blue: { border: '#3b82f6', bg: '#eff6ff', text: '#2563eb' },
      green: { border: '#22c55e', bg: '#f0fdf4', text: '#16a34a' },
      red: { border: '#ef4444', bg: '#fef2f2', text: '#dc2626' },
      purple: { border: '#a855f7', bg: '#faf5ff', text: '#9333ea' }
    };
    return colors[c] || colors.blue;
  };

  const currentTheme = getColor(color);

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      {label && (
        <label style={{ display: 'block', fontSize: '1rem', fontWeight: '600', color: '#334155', marginBottom: '0.75rem' }}>
          {label}
        </label>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => handleToggle(option)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '2rem',
                border: '1px solid',
                borderColor: isSelected ? currentTheme.border : '#e2e8f0',
                backgroundColor: isSelected ? currentTheme.bg : 'white',
                color: isSelected ? currentTheme.text : '#64748b',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              {isSelected && <span>✓</span>}
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickSelectTags;