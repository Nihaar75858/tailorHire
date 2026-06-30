import { render, screen } from '@testing-library/react';
import { test, expect, vi, beforeEach } from "vitest";
import ChatWindow from '../src/components/chat/ChatWindow';

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

// JSDOM doesn't implement scrollIntoView -- stub it so useEffect doesn't throw
beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

test('shows an empty state with an icon and helper text when there are no messages', () => {
  render(<ChatWindow messages={[]} />);

  expect(screen.getByTestId('icon-message-square')).toBeInTheDocument();
  expect(screen.getByText(/start a conversation/i)).toBeInTheDocument();
  expect(screen.getByText(/try asking about interview tips/i)).toBeInTheDocument();
  expect(screen.queryByTestId('chat-message')).not.toBeInTheDocument();
});

test('renders one ChatMessage per item, passing message and sender correctly', () => {
  const messages = [
    { id: '1-user', message: 'Hi there', sender: 'user' },
    { id: '1-ai', message: 'Hello! How can I help?', sender: 'ai' },
  ];

  render(<ChatWindow messages={messages} />);

  const bubbles = screen.getAllByTestId('chat-message');
  expect(bubbles).toHaveLength(2);
  expect(bubbles[0]).toHaveTextContent('Hi there');
  expect(bubbles[0]).toHaveAttribute('data-sender', 'user');
  expect(bubbles[1]).toHaveTextContent('Hello! How can I help?');
  expect(bubbles[1]).toHaveAttribute('data-sender', 'ai');
});

test('renders messages in the order provided, without reordering', () => {
  const messages = [
    { id: 'a', message: 'First', sender: 'user' },
    { id: 'b', message: 'Second', sender: 'ai' },
    { id: 'c', message: 'Third', sender: 'user' },
  ];

  render(<ChatWindow messages={messages} />);

  const bubbles = screen.getAllByTestId('chat-message');
  expect(bubbles.map((b) => b.textContent)).toEqual(['First', 'Second', 'Third']);
});

test('calls scrollIntoView when messages change', () => {
  const { rerender } = render(<ChatWindow messages={[]} />);

  expect(Element.prototype.scrollIntoView).toHaveBeenCalled();

  Element.prototype.scrollIntoView.mockClear();

  rerender(<ChatWindow messages={[{ id: '1', message: 'Hi', sender: 'user' }]} />);

  expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
});