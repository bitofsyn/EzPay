import { render, screen, fireEvent } from '@testing-library/react';
import Input from '../Input';

describe('Input Component', () => {
  it('renders input with label', () => {
    render(
      <Input
        label="Email"
        value=""
        onChange={() => {}}
      />
    );

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('displays error message when provided', () => {
    render(
      <Input
        label="Email"
        value=""
        onChange={() => {}}
        error="Invalid email"
      />
    );

    const errorMessage = screen.getByRole('alert');
    expect(errorMessage).toHaveTextContent('Invalid email');
  });

  it('marks field as required when required prop is true', () => {
    render(
      <Input
        label="Email"
        value=""
        onChange={() => {}}
        required={true}
      />
    );

    const input = screen.getByLabelText(/Email/);
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('sets aria-invalid when error is present', () => {
    render(
      <Input
        label="Email"
        value=""
        onChange={() => {}}
        error="Invalid input"
      />
    );

    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('calls onChange when value changes', () => {
    const handleChange = jest.fn();
    render(
      <Input
        label="Name"
        value=""
        onChange={handleChange}
      />
    );

    const input = screen.getByLabelText('Name');
    fireEvent.change(input, { target: { value: 'John' } });

    expect(handleChange).toHaveBeenCalled();
  });

  it('is disabled when disabled prop is true', () => {
    render(
      <Input
        label="Email"
        value=""
        onChange={() => {}}
        disabled={true}
      />
    );

    const input = screen.getByLabelText('Email');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('cursor-not-allowed');
  });

  it('links label and input with htmlFor/id', () => {
    render(
      <Input
        id="test-input"
        label="Test Label"
        value=""
        onChange={() => {}}
      />
    );

    const input = screen.getByLabelText('Test Label');
    expect(input).toHaveAttribute('id', 'test-input');
  });
});
