/**
 * Toast Component Tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import Toast from '../Toast';

describe('Toast Component', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders toast message', () => {
    render(
      <Toast
        id={1}
        message="Success message"
        type="success"
        duration={4000}
        onClose={mockOnClose}
      />
    );
    
    expect(screen.getByText('Success message')).toBeInTheDocument();
  });

  it('displays correct icon for success type', () => {
    render(
      <Toast
        id={1}
        message="Success"
        type="success"
        duration={4000}
        onClose={mockOnClose}
      />
    );
    
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('displays correct icon for error type', () => {
    render(
      <Toast
        id={1}
        message="Error"
        type="error"
        duration={4000}
        onClose={mockOnClose}
      />
    );
    
    expect(screen.getByText('✕')).toBeInTheDocument();
  });

  it('displays correct icon for warning type', () => {
    render(
      <Toast
        id={1}
        message="Warning"
        type="warning"
        duration={4000}
        onClose={mockOnClose}
      />
    );
    
    expect(screen.getByText('⚠')).toBeInTheDocument();
  });

  it('displays correct icon for info type', () => {
    render(
      <Toast
        id={1}
        message="Info"
        type="info"
        duration={4000}
        onClose={mockOnClose}
      />
    );
    
    expect(screen.getByText('ℹ')).toBeInTheDocument();
  });

  it('has correct CSS class for type', () => {
    const { container } = render(
      <Toast
        id={1}
        message="Success"
        type="success"
        duration={4000}
        onClose={mockOnClose}
      />
    );
    
    expect(container.querySelector('.toast-success')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <Toast
        id={1}
        message="Test message"
        type="info"
        duration={4000}
        onClose={mockOnClose}
      />
    );
    
    const closeButton = screen.getByText('×');
    closeButton.click();
    expect(mockOnClose).toHaveBeenCalledWith(1);
  });

  it('auto-dismisses after duration', () => {
    render(
      <Toast
        id={1}
        message="Auto dismiss"
        type="success"
        duration={3000}
        onClose={mockOnClose}
      />
    );
    
    jest.advanceTimersByTime(3000);
    expect(mockOnClose).toHaveBeenCalledWith(1);
  });

  it('does not auto-dismiss when duration is 0', () => {
    render(
      <Toast
        id={1}
        message="No auto dismiss"
        type="error"
        duration={0}
        onClose={mockOnClose}
      />
    );
    
    jest.advanceTimersByTime(10000);
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('has close button', () => {
    render(
      <Toast
        id={1}
        message="Test"
        type="info"
        duration={4000}
        onClose={mockOnClose}
      />
    );
    
    expect(screen.getByText('×')).toBeInTheDocument();
  });
});
