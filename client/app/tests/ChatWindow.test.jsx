// tests/ChatWindow.test.jsx
import { render, screen } from '@testing-library/react';
import { test, expect, vi, beforeEach } from 'vitest';
import ChatWindow from '../src/components/chat/ChatWindow';

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('lucide-react', () => ({
  MessageSquare: (props) => <svg data-testid="icon-message-square" {...props} />,
}));

vi.mock('../src/components/chat/ChatMessage', () => ({
  default: ({ message, sender }) => (
    <div data-testid="chat-message" data-sender={sender}>
      {message}
    </div>
  ),
}));

// scrollIntoView is not implemented in jsdom
beforeEach(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

// ── Empty state ────────────────────────────────────────────────────────────

test('renders the empty state when messages is an empty array', () => {
  render(<ChatWindow messages={[]} />);

  expect(screen.getByText(/start a conversation/i)).toBeInTheDocument();
});

test('renders the empty-state hint text', () => {
  render(<ChatWindow messages={[]} />);

  expect(screen.getByText(/interview tips or career advice/i)).toBeInTheDocument();
});

test('renders the MessageSquare icon in the empty state', () => {
  render(<ChatWindow messages={[]} />);

  expect(screen.getByTestId('icon-message-square')).toBeInTheDocument();
});

test('does not render any chat messages in the empty state', () => {
  render(<ChatWindow messages={[]} />);

  expect(screen.queryAllByTestId('chat-message')).toHaveLength(0);
});

// ── Message list ───────────────────────────────────────────────────────────

const sampleMessages = [
  { id: 1, text: 'Hello!', sender: 'user' },
  { id: 2, text: 'Hi there!', sender: 'ai' },
  { id: 3, text: 'How are you?', sender: 'user' },
];

test('renders one ChatMessage per message in the array', () => {
  render(<ChatWindow messages={sampleMessages} />);

  expect(screen.getAllByTestId('chat-message')).toHaveLength(sampleMessages.length);
});

test('passes the correct message text to each ChatMessage', () => {
  render(<ChatWindow messages={sampleMessages} />);

  expect(screen.getByText('Hello!')).toBeInTheDocument();
  expect(screen.getByText('Hi there!')).toBeInTheDocument();
  expect(screen.getByText('How are you?')).toBeInTheDocument();
});

test('passes the correct sender to each ChatMessage', () => {
  render(<ChatWindow messages={sampleMessages} />);

  const rendered = screen.getAllByTestId('chat-message');

  expect(rendered[0]).toHaveAttribute('data-sender', 'user');
  expect(rendered[1]).toHaveAttribute('data-sender', 'ai');
  expect(rendered[2]).toHaveAttribute('data-sender', 'user');
});

test('does not render the empty state when messages are present', () => {
  render(<ChatWindow messages={sampleMessages} />);

  expect(screen.queryByText(/start a conversation/i)).not.toBeInTheDocument();
  expect(screen.queryByTestId('icon-message-square')).not.toBeInTheDocument();
});

// ── Scroll behaviour ───────────────────────────────────────────────────────

test('calls scrollIntoView on initial render', () => {
  render(<ChatWindow messages={sampleMessages} />);

  expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();
});

test('calls scrollIntoView again when the messages array changes', () => {
  const { rerender } = render(<ChatWindow messages={sampleMessages} />);

  const callsBefore = window.HTMLElement.prototype.scrollIntoView.mock.calls.length;

  rerender(<ChatWindow messages={[...sampleMessages, { id: 4, text: 'New!', sender: 'ai' }]} />);

  expect(window.HTMLElement.prototype.scrollIntoView.mock.calls.length).toBeGreaterThan(callsBefore);
});