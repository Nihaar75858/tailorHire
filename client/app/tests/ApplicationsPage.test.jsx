import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, vi, beforeEach } from "vitest";
import ApplicationsPage from "../src/pages/Application/ApplicationsPage";
import api from "../src/services/api";

vi.mock("../src/services/api", () => ({
  default: {
    getApplications: vi.fn(),
  },
}));

const mockApplications = [
  {
    id: 1,
    status: "applied",
    applied_at: "2024-01-01T10:00:00Z",
    updated_at: "2024-01-01T12:00:00Z",
    cover_letter: "My amazing cover letter",
    resume: "resume.pdf",
    job_details: {
      title: "Frontend Developer",
      company: "TechCorp",
      description: "Build great UIs",
      requirements: ["React", "TypeScript"],
    },
  },
  {
    id: 2,
    status: "interview",
    applied_at: "2024-01-02T10:00:00Z",
    updated_at: "2024-01-02T12:00:00Z",
    job_details: {
      title: "Backend Developer",
      company: "DataCorp",
      description: "Build APIs",
      requirements: ["Node", "SQL"],
    },
  },
];

describe("ApplicationsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("shows loading state initially", () => {
    api.getApplications.mockResolvedValue({ results: [] });

    render(<ApplicationsPage />);

    expect(screen.getByText(/loading your applications/i)).toBeInTheDocument();
  });

  test("loads and displays applications", async () => {
    api.getApplications.mockResolvedValue({
      results: mockApplications,
    });

    render(<ApplicationsPage />);

    await waitFor(() => {
      expect(screen.getByText("Frontend Developer")).toBeInTheDocument();
    });

    expect(screen.getByText("Backend Developer")).toBeInTheDocument();
  });

  test("shows empty state when no applications", async () => {
    api.getApplications.mockResolvedValue({
      results: [],
    });

    render(<ApplicationsPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/you haven't applied to any jobs yet/i),
      ).toBeInTheDocument();
    });
  });

  test("shows error message when API fails", async () => {
    api.getApplications.mockRejectedValue(new Error("API failed"));

    render(<ApplicationsPage />);

    await waitFor(() => {
      expect(screen.getByText(/error: api failed/i)).toBeInTheDocument();
    });
  });

  test("filters applications by status", async () => {
    api.getApplications.mockResolvedValue({
      results: mockApplications,
    });

    render(<ApplicationsPage />);

    await waitFor(() => {
      expect(screen.getByText("Frontend Developer")).toBeInTheDocument();
    });

    const interviewFilter = screen.getByRole("button", {
      name: /interview scheduled/i,
    });

    await userEvent.click(interviewFilter);

    expect(screen.queryByText("Frontend Developer")).not.toBeInTheDocument();
    expect(screen.getByText("Backend Developer")).toBeInTheDocument();
  });

  test("opens cover letter modal", async () => {
    api.getApplications.mockResolvedValue({
      results: mockApplications,
    });

    render(<ApplicationsPage />);

    await waitFor(() => {
      expect(screen.getByText(/view cover letter/i)).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText(/view cover letter/i));

    expect(
      screen.getByRole("heading", { name: /cover letter/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/my amazing cover letter/i)).toBeInTheDocument();
  });

  test("closes cover letter modal", async () => {
    api.getApplications.mockResolvedValue({
      results: mockApplications,
    });

    render(<ApplicationsPage />);

    await waitFor(() => {
      expect(screen.getByText(/view cover letter/i)).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText(/view cover letter/i));

    await userEvent.click(screen.getByRole("button", { name: /close/i }));

    expect(
      screen.queryByText(/my amazing cover letter/i),
    ).not.toBeInTheDocument();
  });
});
