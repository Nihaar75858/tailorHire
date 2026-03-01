import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { test, expect, vi, beforeEach } from "vitest";
import CoverLetterPage from "../src/pages/CoverLetter/CoverLetterPage";

// Mock useAuth hook
vi.mock("../src/components/hooks/useAuth", () => ({
  useUser: () => ({
    user: {
      username: "testuser",
      first_name: "John",
      last_name: "Doe",
      email: "john@example.com",
      skills: "React, JavaScript, Node.js",
      role: ["User"],
    },
    userType: "User",
    setUser: vi.fn(),
  }),
}));

vi.mock("../src/services/api", () => ({
  default: {
    generateCoverLetter: vi.fn(),
    getCoverLetters: vi.fn(),
  },
}));

import api from "../src/services/api";

// Mock clipboard and alert
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
  },
});
global.alert = vi.fn();

test("renders backend generated content", async () => {
  api.generateCoverLetter.mockResolvedValue({
    generated_letter: "React experience mentioned here",
  });

  api.getCoverLetters.mockResolvedValue([]);

  render(<CoverLetterPage />);

  fireEvent.change(
    screen.getByPlaceholderText("Paste the job description here..."),
    { target: { value: "Software Engineer role" } },
  );

  fireEvent.click(screen.getByText("Generate Cover Letter"));

  expect(await screen.findByText(/React experience/)).toBeInTheDocument();
});

test("shows alert when trying to generate without job description", async () => {
  render(<CoverLetterPage />);

  fireEvent.click(screen.getByText("Generate Cover Letter"));

  await screen.findByText("AI Cover Letter Generator");

  expect(global.alert).toHaveBeenCalledWith("Please enter a job description");
});

test("generates cover letter after clicking generate", async () => {
  api.generateCoverLetter.mockResolvedValue({
    generated_letter:
      "Dear Hiring Manager,\n\nJohn is great.\n\nSincerely,\nJohn",
  });

  api.getCoverLetters.mockResolvedValue([]);

  render(<CoverLetterPage />);

  fireEvent.change(
    screen.getByPlaceholderText("Paste the job description here..."),
    { target: { value: "Software Engineer role" } },
  );

  fireEvent.click(screen.getByText("Generate Cover Letter"));

  expect(screen.getByText("Generating with AI...")).toBeInTheDocument();

  expect(await screen.findByText("Generated Cover Letter")).toBeInTheDocument();

  expect(screen.getByText(/John/)).toBeInTheDocument();

  expect(api.generateCoverLetter).toHaveBeenCalledWith({
    job_description: "Software Engineer role",
    resume_text: "",
  });
});

test("copies to clipboard", async () => {
  api.generateCoverLetter.mockResolvedValue({
    generated_letter: "Test letter content",
  });

  api.getCoverLetters.mockResolvedValue([]);

  render(<CoverLetterPage />);

  fireEvent.change(
    screen.getByPlaceholderText("Paste the job description here..."),
    { target: { value: "Software Engineer role" } },
  );

  fireEvent.click(screen.getByText("Generate Cover Letter"));

  await screen.findByText("Copy to Clipboard");

  fireEvent.click(screen.getByText("Copy to Clipboard"));

  expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
    "Test letter content",
  );
});

test("renders generated letter from backend", async () => {
  api.generateCoverLetter.mockResolvedValue({
    generated_letter: "This letter highlights React and Node.js experience.",
  });

  api.getCoverLetters.mockResolvedValue([]);

  render(<CoverLetterPage />);

  fireEvent.change(
    screen.getByPlaceholderText("Paste the job description here..."),
    { target: { value: "Software Engineer role" } },
  );

  fireEvent.click(screen.getByText("Generate Cover Letter"));

  // Wait for async render
  expect(await screen.findByText("Generated Cover Letter")).toBeInTheDocument();

  expect(screen.getByText(/React and Node.js experience/)).toBeInTheDocument();
});

test("button is disabled while generating", async () => {
  let resolvePromise;

  const mockPromise = new Promise((resolve) => {
    resolvePromise = resolve;
  });

  api.generateCoverLetter.mockResolvedValue(mockPromise);
  api.getCoverLetters.mockResolvedValue([]);

  render(<CoverLetterPage />);

  fireEvent.change(
    screen.getByPlaceholderText("Paste the job description here..."),
    { target: { value: "Software Engineer role" } },
  );

  const button = screen.getByRole("button", {
    name: "Generate Cover Letter",
  });

  fireEvent.click(button);

  expect(button).toBeDisabled();
  expect(button).toHaveTextContent("Generating with AI...");

  // Resolve the promise to finish
  resolvePromise({ generated_letter: "Test letter" });

  await screen.findByText("Generated Cover Letter");
});

test("shows error if API fails", async () => {
  api.generateCoverLetter.mockRejectedValue(new Error("API failed"));
  api.getCoverLetters.mockResolvedValue([]);

  render(<CoverLetterPage />);

  fireEvent.change(
    screen.getByPlaceholderText("Paste the job description here..."),
    { target: { value: "Software Engineer role" } },
  );

  fireEvent.click(screen.getByText("Generate Cover Letter"));

  expect(await screen.findByText("API failed")).toBeInTheDocument();
});
