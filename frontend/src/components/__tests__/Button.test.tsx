import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../Button';

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button text="Click me" />);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button text="Click me" onClick={handleClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button text="Click me" disabled={true} />);
    const button = screen.getByRole('button');

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });

  it('uses custom aria-label when provided', () => {
    render(<Button text="Submit" ariaLabel="Submit form" />);
    expect(screen.getByRole('button', { name: 'Submit form' })).toBeInTheDocument();
  });

  it('has proper focus styles', () => {
    render(<Button text="Focus me" />);
    const button = screen.getByRole('button');

    expect(button).toHaveClass('focus:outline-none', 'focus:ring-2');
  });
});
