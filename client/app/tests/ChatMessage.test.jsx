import { render, screen } from '@testing-library/react';
import { test, expect } from "vitest";
import ChatMessage from '../src/components/chat/ChatMessage';

test('renders the message text', () => {
  render(<ChatMessage message="Hello there" sender="user" />);

  expect(screen.getByText('Hello there')).toBeInTheDocument();
});

test('aligns to the right and uses white styling when sender is "user"', () => {
  const { container } = render(<ChatMessage message="Hi" sender="user" />);

  const outerDiv = container.firstChild;
  const bubble = outerDiv.firstChild;

  expect(outerDiv.className).toContain('justify-end');
  expect(bubble.className).toContain('bg-neutral-600');
  expect(bubble.className).toContain('text-white');
});

test('aligns to the left and uses gray styling when sender is not "user"', () => {
  const { container } = render(<ChatMessage message="Hello!" sender="ai" />);

  const outerDiv = container.firstChild;
  const bubble = outerDiv.firstChild;

  expect(outerDiv.className).toContain('justify-start');
  expect(bubble.className).toContain('text-black');
});

test('treats any non-"user" sender value as a bot message', () => {
  const { container } = render(<ChatMessage message="Hi" sender="assistant" />);

  const outerDiv = container.firstChild;

  expect(outerDiv.className).toContain('justify-start');
});

test('renders without crashing when message is an empty string', () => {
  const { container } = render(<ChatMessage message="" sender="user" />);

  const bubble = container.firstChild.firstChild;
  expect(bubble).toBeInTheDocument();
  expect(bubble.textContent).toBe('');
});