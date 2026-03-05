import React from 'react';
import './FormError.css';

const FormError = ({ error, touched = true }) => {
  if (!error || !touched) {
    return null;
  }

  return (
    <div className="form-error">
      <span className="form-error-icon">⚠</span>
      <span className="form-error-message">{error}</span>
    </div>
  );
};

export default FormError;
