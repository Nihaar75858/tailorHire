import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import Register from "../src/pages/Auth/Register";

beforeEach(() => {
  globalThis.alert = vi.fn();
  globalThis.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ message: "Registration successful" }),
    })
  );
});

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.stubEnv("VITE_API_BASE_URL", "http://127.0.0.1:8000/api");

describe("Register Component", () => {
  it("renders all form fields", () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    expect(screen.getByPlaceholderText(/First Name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Last Name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Username/i)).toBeInTheDocument();
    const passwordFields = screen.getAllByPlaceholderText(/Password/i);
    expect(passwordFields.length).toBe(2);
    expect(passwordFields[0]).toBeInTheDocument();
    expect(passwordFields[1]).toBeInTheDocument();
  });

  it("submits form data correctly and navigates to login", async () => {
    const mockResponse = { message: "Registration successful!" };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/First Name/i), {
      target: { value: "John", name: "firstName" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Last Name/i), {
      target: { value: "Doe", name: "lastName" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Email/i), {
      target: { value: "john@example.com", name: "email" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Username/i), {
      target: { value: "johndoe", name: "username" },
    });
    const [passwordInput, confirmInput] =
      screen.getAllByPlaceholderText(/Password/i);
    fireEvent.change(passwordInput, { target: { value: "pass123" } });
    fireEvent.change(confirmInput, { target: { value: "pass123" } });

    fireEvent.click(screen.getByRole("button", { name: /register/i }));

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "http://127.0.0.1:8000/api/users/",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: "John",
            lastName: "Doe",
            email: "john@example.com",
            username: "johndoe",
            password: "pass123",
          }),
        })
      )
    );
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });
});

afterEach(() => {
  vi.clearAllMocks();
});
