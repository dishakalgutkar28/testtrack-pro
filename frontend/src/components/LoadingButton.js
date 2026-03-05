import React from 'react';
import './LoadingButton.css';

const LoadingButton = ({ 
  children, 
  loading = false, 
  disabled = false,
  type = 'button',
  variant = 'primary',
  onClick,
  className = '',
  ...props 
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`loading-button loading-button-${variant} ${loading ? 'loading' : ''} ${className}`}
      {...props}
    >
      {loading && (
        <span className="spinner">
          <span className="spinner-circle"></span>
        </span>
      )}
      <span className={loading ? 'button-text-loading' : 'button-text'}>
        {loading ? 'Loading...' : children}
      </span>
    </button>
  );
};

export default LoadingButton;
