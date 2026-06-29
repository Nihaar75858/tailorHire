import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, expect, vi } from "vitest";
import ChatInput from '../src/components/chat/ChatInput';

vi.mock('lucide-react', () => ({
  Send: (props) => <svg data-testid="icon-send" {...props} />,
}));

const mockSend = vi.fn();

test('renders an empty input and a disabled send button initially', () => {
  render(<ChatInput onSend={mockSend} disabled={false} />);

  const input = screen.getByPlaceholderText(/type your message/i);
  const button = screen.getByRole('button');

  expect(input.value).toBe('');
  expect(button).toBeDisabled();
});

test('enables the send button once text is typed', async () => {
  render(<ChatInput onSend={mockSend} disabled={false} />);

  const input = screen.getByPlaceholderText(/type your message/i);
  await userEvent.type(input, 'Hello');

  expect(screen.getByRole('button')).not.toBeDisabled();
});

test('keeps the send button disabled when input is only whitespace', async () => {
  render(<ChatInput onSend={mockSend} disabled={false} />);

  const input = screen.getByPlaceholderText(/type your message/i);
  await userEvent.type(input, '   ');

  expect(screen.getByRole('button')).toBeDisabled();
});

test('calls onSend with the input value when the send button is clicked', async () => {
  render(<ChatInput onSend={mockSend} disabled={false} />);

  const input = screen.getByPlaceholderText(/type your message/i);
  await userEvent.type(input, 'Hello there');
  await userEvent.click(screen.getByRole('button'));

  expect(mockSend).toHaveBeenCalledWith('Hello there');
});

test('clears the input after sending', async () => {
  render(<ChatInput onSend={mockSend} disabled={false} />);

  const input = screen.getByPlaceholderText(/type your message/i);
  await userEvent.type(input, 'Hello there');
  await userEvent.click(screen.getByRole('button'));

  expect(input.value).toBe('');
});

test('sends the message when Enter is pressed', async () => {
  render(<ChatInput onSend={mockSend} disabled={false} />);

  const input = screen.getByPlaceholderText(/type your message/i);
  await userEvent.type(input, 'Hello{Enter}');

  expect(mockSend).toHaveBeenCalledWith('Hello');
});

test('does not send when Shift+Enter is pressed', async () => {
  render(<ChatInput onSend={mockSend} disabled={false} />);

  const input = screen.getByPlaceholderText(/type your message/i);
  await userEvent.type(input, 'Hello{Shift>}{Enter}{/Shift}');

  expect(mockSend).not.toHaveBeenCalled();
});

test('disables both the input and the send button when disabled is true', () => {
  render(<ChatInput onSend={mockSend} disabled={true} />);

  const input = screen.getByPlaceholderText(/type your message/i);
  const button = screen.getByRole('button');

  expect(input).toBeDisabled();
  expect(button).toBeDisabled();
});

test('clicking a disabled send button does not call onSend', async () => {
  render(<ChatInput onSend={mockSend} disabled={true} />);

  await userEvent.click(screen.getByRole('button'));

  expect(mockSend).not.toHaveBeenCalled();
});

test('renders the Send icon', () => {
  render(<ChatInput onSend={mockSend} disabled={false} />);

  expect(screen.getByTestId('icon-send')).toBeInTheDocument();
});