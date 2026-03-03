import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import ApplicationModal from "../src/components/applications/ApplicationModal";

vi.mock("../src/services/api");

import api from "../src/services/api";
const mockJob = {
  id: 1,
  title: "Frontend Developer",
  company: "Tech Corp",
  description: "React job description"
};

test("fetches and displays cover letters on mount", async () => {
  api.getCoverLetters.mockResolvedValue([
    {
      id: 10,
      generated_letter: "Test letter",
      created_at: new Date().toISOString(),
    },
  ]);

  render(
    <ApplicationModal job={mockJob} onSubmit={vi.fn()} onClose={vi.fn()} />
  );

  expect(screen.getByText(/Loading your cover letters/i)).toBeInTheDocument();

  await waitFor(() =>
    expect(api.getCoverLetters).toHaveBeenCalled()
  );

  expect(screen.getByText(/Test letter/i)).toBeInTheDocument();
});

test("generates new cover letter and selects it", async () => {
  api.getCoverLetters.mockResolvedValue([]);

  api.generateCoverLetter.mockResolvedValue({
    id: 99,
    generated_letter: "New AI Letter",
    created_at: new Date().toISOString(),
  });

  render(
    <ApplicationModal job={mockJob} onSubmit={vi.fn()} onClose={vi.fn()} />
  );

  await waitFor(() => expect(api.getCoverLetters).toHaveBeenCalled());

  fireEvent.click(screen.getByText(/Generate New/i));

  await waitFor(() =>
    expect(api.generateCoverLetter).toHaveBeenCalledWith({
      job_description: mockJob.description,
      job: mockJob.id,
    })
  );

  expect(screen.getAllByText(/New AI Letter/i).length).toBeGreaterThan(0);
});

test("selects a cover letter when clicked", async () => {
  api.getCoverLetters.mockResolvedValue([
    {
      id: 1,
      generated_letter: "Letter One",
      created_at: new Date().toISOString(),
    },
  ]);

  render(
    <ApplicationModal job={mockJob} onSubmit={vi.fn()} onClose={vi.fn()} />
  );

  await waitFor(() => screen.getByText(/Letter One/i));

  fireEvent.click(screen.getByText(/Letter One/i));

  expect(screen.getByText(/Preview/i)).toBeInTheDocument();
});

test("submits selected cover letter", async () => {
  api.getCoverLetters.mockResolvedValue([
    {
      id: 1,
      generated_letter: "Letter One",
      created_at: new Date().toISOString(),
    },
  ]);

  const onSubmit = vi.fn();

  render(
    <ApplicationModal job={mockJob} onSubmit={onSubmit} onClose={vi.fn()} />
  );

  await waitFor(() => screen.getByText(/Letter One/i));

  fireEvent.click(screen.getByText(/Letter One/i));
  fireEvent.click(screen.getByText(/Submit Application/i));

  expect(onSubmit).toHaveBeenCalledWith({
    cover_letter: "Letter One",
    cover_letter_id: 1,
  });
});

test("submits custom cover letter when enabled", async () => {
  api.getCoverLetters.mockResolvedValue([]);

  const onSubmit = vi.fn();

  render(
    <ApplicationModal job={mockJob} onSubmit={onSubmit} onClose={vi.fn()} />
  );

  await waitFor(() => expect(api.getCoverLetters).toHaveBeenCalled());

  fireEvent.click(screen.getByLabelText(/Use custom letter/i));

  const textarea = screen.getByPlaceholderText(/Write your own/i);
  fireEvent.change(textarea, {
    target: { value: "My custom letter" },
  });

  fireEvent.click(screen.getByText(/Submit Application/i));

  expect(onSubmit).toHaveBeenCalledWith({
    cover_letter: "My custom letter",
    cover_letter_id: null,
  });
});

test("calls onClose when cancel is clicked", async () => {
  api.getCoverLetters.mockResolvedValue([]);

  const onClose = vi.fn();

  render(
    <ApplicationModal job={mockJob} onSubmit={vi.fn()} onClose={onClose} />
  );

  await waitFor(() => expect(api.getCoverLetters).toHaveBeenCalled());

  fireEvent.click(screen.getByText(/Cancel/i));

  expect(onClose).toHaveBeenCalled();
});

