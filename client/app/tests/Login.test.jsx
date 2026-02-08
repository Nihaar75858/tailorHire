// tests/Login.test.jsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import Login from "../src/pages/Auth/Login";

// Mock navigate function from react-router
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.stubEnv("VITE_API_BASE_URL", "http://127.0.0.1:8000/api");

beforeEach(() => {
  global.alert = vi.fn();
  global.fetch = vi.fn();
  Storage.prototype.setItem = vi.fn();
});

describe("Login Component", () => {
  it("renders all login form fields", () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    expect(screen.getByPlaceholderText(/Username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  it("submits login credentials correctly", async () => {
    const mockResponse = { message: "Login successful" };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Username/i), {
      target: { value: "johndoe", name: "username" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Password/i), {
      target: { value: "pass123", name: "password" },
    });

    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "http://127.0.0.1:8000/api/users/login_user/",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: "johndoe", password: "pass123" }),
        })
      )
    );

    // optional: verify navigation
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/userdashboard")
    );
  });

  it("saves access and refresh tokens to localStorage on successful login", async () => {
    const mockResponse = {
      message: "Login successful",
      access: "mockAccessToken123",
      refresh: "mockRefreshToken456",
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Username/i), {
      target: { value: "johndoe", name: "username" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Password/i), {
      target: { value: "pass123", name: "password" },
    });

    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "accessToken",
        "mockAccessToken123"
      );
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "refreshToken",
        "mockRefreshToken456"
      );
    });

    expect(mockNavigate).toHaveBeenCalledWith("/userdashboard");
  });
});

afterEach(() => {
  vi.clearAllMocks();
});
