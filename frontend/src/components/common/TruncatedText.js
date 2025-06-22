import React, { useState } from 'react';
import './TruncatedText.css';

const TruncatedText = ({ 
  text, 
  maxLength = 150, 
  className = '', 
  showMoreText = 'Show More',
  showLessText = 'Show Less',
  element = 'p'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const shouldTruncate = text && text.length > maxLength;
  const displayText = shouldTruncate && !isExpanded 
    ? text.substring(0, maxLength) + '...'
    : text;

  const Element = element;

  if (!shouldTruncate) {
    return <Element className={className}>{text}</Element>;
  }

  return (
    <div className="truncated-text-container">
      <Element className={className}>{displayText}</Element>
      <button 
        className="truncated-text-toggle"
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
      >
        {isExpanded ? showLessText : showMoreText}
      </button>
    </div>
  );
};

export default TruncatedText; 