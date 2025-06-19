import React from 'react';

interface SuccessMessageProps {
  message: string;
  onClose?: () => void;
}

const SuccessMessage: React.FC<SuccessMessageProps> = ({ message, onClose }) => (
  <div className="success-message" role="alert" aria-live="polite">
    <div className="success-content">
      <span className="success-icon">✅</span>
      <span className="success-text">{message}</span>
      {onClose && (
        <button 
          className="success-close" 
          onClick={onClose}
          aria-label="Close success message"
        >
          ×
        </button>
      )}
    </div>
  </div>
);

export default SuccessMessage;

