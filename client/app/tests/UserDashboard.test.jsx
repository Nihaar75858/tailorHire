import { render, screen } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import UserDashboard from "../src/pages/User/UserDashboard";
import { useUser } from "../src/components/hooks/useAuth";

// Mock the `useUser` hook
vi.mock("../src/components/hooks/useAuth");

describe("UserDashboard Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders loading state when user is not available", () => {
    useUser.mockReturnValue({ user: null });

    render(
      <MemoryRouter>
        <UserDashboard />
      </MemoryRouter>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test("renders welcome message with username when user is present", () => {
    useUser.mockReturnValue({ user: { username: "Alice" } });

    render(
      <MemoryRouter>
        <UserDashboard />
      </MemoryRouter>
    );

    expect(screen.getByText(/welcome, alice/i)).toBeInTheDocument();
  });

  test("renders all dashboard cards with correct titles", () => {
    useUser.mockReturnValue({ user: { username: "Bob" } });

    render(
      <MemoryRouter>
        <UserDashboard />
      </MemoryRouter>
    );

    const cards = [
      "Resume & Cover Letters",
      "Job Postings",
      "Chat with TailorHire",
    ];

    cards.forEach((title) => {
      expect(screen.getByText(title)).toBeInTheDocument();
    });
  });
});
