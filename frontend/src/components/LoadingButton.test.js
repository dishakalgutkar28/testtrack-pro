/**
 * LoadingButton Component Tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingButton from '../LoadingButton';

describe('LoadingButton Component', () => {
  it('renders button with text', () => {
    render(<LoadingButton>Click me</LoadingButton>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it('renders with primary variant by default', () => {
    render(<LoadingButton>Login</LoadingButton>);
    const button = screen.getByRole('button', { name: /login/i });
    expect(button).toHaveClass('loading-button-primary');
  });

  it('applies correct variant class', () => {
    render(<LoadingButton variant="success">Save</LoadingButton>);
    const button = screen.getByRole('button', { name: /save/i });
    expect(button).toHaveClass('loading-button-success');
  });

  it('disables button when loading', () => {
    render(<LoadingButton loading={true}>Submit</LoadingButton>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('shows Loading text when loading', () => {
    render(<LoadingButton loading={true}>Submit</LoadingButton>);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('disables button when disabled prop is true', () => {
    render(<LoadingButton disabled={true}>Click</LoadingButton>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('adds custom className', () => {
    render(
      <LoadingButton className="custom-class">
        Click
      </LoadingButton>
    );
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('handles onClick when not loading', () => {
    const handleClick = jest.fn();
    render(
      <LoadingButton onClick={handleClick} loading={false}>
        Click
      </LoadingButton>
    );
    
    const button = screen.getByRole('button');
    button.click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('has correct button type', () => {
    render(<LoadingButton type="submit">Submit</LoadingButton>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'submit');
  });
});
