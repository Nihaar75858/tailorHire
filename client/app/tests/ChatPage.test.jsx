import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, expect, vi, beforeEach } from "vitest";
import ChatPage from '../src/pages/Chat/ChatPage';
import ApiService from '../src/services/api';

vi.mock('../src/services/api', () => ({
  default: {
    getChatHistory: vi.fn(),
    sendMessage: vi.fn(),
  },
}));

vi.mock('../src/components/chat/ChatWindow', () => ({
  default: ({ messages }) => (
    <div data-testid="chat-window">
      {messages.map((m) => (
        <div key={m.id} data-testid="chat-bubble" data-sender={m.sender}>
          {m.message}
        </div>
      ))}
    </div>
  ),
}));

vi.mock('../src/components/chat/ChatInput', () => ({
  default: ({ onSend, disabled }) => (
    <div data-testid="chat-input">
      <button disabled={disabled} onClick={() => onSend('Test message')}>
        Send
      </button>
    </div>
  ),
}));

beforeEach(() => {
  vi.restoreAllMocks();
});

test('shows a loading state while chat history is being fetched', () => {
  ApiService.getChatHistory.mockReturnValue(new Promise(() => {}));

  render(<ChatPage />);

  expect(screen.getByText(/loading conversation/i)).toBeInTheDocument();
  expect(screen.queryByTestId('chat-window')).not.toBeInTheDocument();
});

test('fetches chat history on mount and flattens each record into user + AI bubbles', async () => {
  ApiService.getChatHistory.mockResolvedValue({
    count: 2,
    results: [
      { id: 2, message: 'Second question', response: 'Second answer', created_at: '2026-06-28T00:01:00Z' },
      { id: 1, message: 'First question', response: 'First answer', created_at: '2026-06-28T00:00:00Z' },
    ],
  });

  render(<ChatPage />);

  await waitFor(() => screen.getByTestId('chat-window'));

  const bubbles = screen.getAllByTestId('chat-bubble');
  expect(bubbles).toHaveLength(4);
  expect(bubbles[0]).toHaveTextContent('First question');
  expect(bubbles[0]).toHaveAttribute('data-sender', 'user');
  expect(bubbles[1]).toHaveTextContent('First answer');
  expect(bubbles[1]).toHaveAttribute('data-sender', 'ai');
  expect(bubbles[2]).toHaveTextContent('Second question');
  expect(bubbles[3]).toHaveTextContent('Second answer');
});

test('shows an error message if fetching history fails', async () => {
  ApiService.getChatHistory.mockRejectedValue(new Error('Network error'));

  render(<ChatPage />);

  await waitFor(() => {
    expect(screen.getByText(/failed to load chat history/i)).toBeInTheDocument();
  });
});

test('optimistically shows the user message immediately on send', async () => {
  ApiService.getChatHistory.mockResolvedValue({ results: [] });
  ApiService.sendMessage.mockReturnValue(new Promise(() => {}));

  render(<ChatPage />);
  await waitFor(() => screen.getByTestId('chat-window'));

  await userEvent.click(screen.getByText('Send'));

  const bubbles = screen.getAllByTestId('chat-bubble');
  expect(bubbles).toHaveLength(1);
  expect(bubbles[0]).toHaveTextContent('Test message');
  expect(bubbles[0]).toHaveAttribute('data-sender', 'user');
});

test('appends the AI response bubble once sendMessage resolves', async () => {
  ApiService.getChatHistory.mockResolvedValue({ results: [] });
  ApiService.sendMessage.mockResolvedValue({
    id: 5,
    message: 'Test message',
    response: 'AI reply here',
    created_at: '2026-06-28T00:05:00Z',
  });

  render(<ChatPage />);
  await waitFor(() => screen.getByTestId('chat-window'));

  await userEvent.click(screen.getByText('Send'));

  await waitFor(() => {
    const bubbles = screen.getAllByTestId('chat-bubble');
    expect(bubbles).toHaveLength(2);
    expect(bubbles[1]).toHaveTextContent('AI reply here');
    expect(bubbles[1]).toHaveAttribute('data-sender', 'ai');
  });
});

test('disables ChatInput while waiting for the AI response', async () => {
  ApiService.getChatHistory.mockResolvedValue({ results: [] });
  let resolveSend;
  ApiService.sendMessage.mockReturnValue(new Promise((resolve) => { resolveSend = resolve; }));

  render(<ChatPage />);
  await waitFor(() => screen.getByTestId('chat-window'));

  await userEvent.click(screen.getByText('Send'));

  expect(screen.getByText('Send')).toBeDisabled();

  resolveSend({ id: 6, message: 'Test message', response: 'Done', created_at: '2026-06-28T00:06:00Z' });

  await waitFor(() => {
    expect(screen.getByText('Send')).not.toBeDisabled();
  });
});

test('shows an error message if sending fails, without crashing', async () => {
  ApiService.getChatHistory.mockResolvedValue({ results: [] });
  ApiService.sendMessage.mockRejectedValue(new Error('Send failed'));

  render(<ChatPage />);
  await waitFor(() => screen.getByTestId('chat-window'));

  await userEvent.click(screen.getByText('Send'));

  await waitFor(() => {
    expect(screen.getByText(/failed to send message/i)).toBeInTheDocument();
  });
});