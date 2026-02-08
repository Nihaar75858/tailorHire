import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import {
  describe,
  test,
  expect,
  beforeEach,
  beforeAll,
  afterEach,
  afterAll,
  vi,
} from "vitest";
import { setupServer } from "msw/node";
import { UserProvider, useUser } from "../src/components/hooks/useAuth";

// Mock the auth utility
vi.mock("../src/utils/auth", () => ({
  getAccessToken: vi.fn(() => null),
  clearTokens: vi.fn(),
}));

import { getAccessToken } from "../src/utils/auth";

// Mock server for backend API
const server = setupServer(
  http.get("*/users/profile/", () => {
    return HttpResponse.json({ username: "John123", role: "Admin" });
  }),
);

// Setup mock server lifecycle
beforeAll(() => server.listen());
afterEach(() => {
  (server.resetHandlers(), vi.clearAllMocks());
});
afterAll(() => server.close());

describe("useUser (Auth Hook)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("returns Viewer by default when no user in localStorage", () => {
    getAccessToken.mockReturnValue(null);

    const { result } = renderHook(() => useUser(), {
      wrapper: ({ children }) => <UserProvider>{children}</UserProvider>,
    });

    expect(result.current.userType).toBe("Viewer");
    expect(result.current.user).toBe(null);
  });

  test("fetches user profile from backend after login", async () => {
    // Mock the token being present
    getAccessToken.mockReturnValue("mock-token");

    const { result } = renderHook(() => useUser(), {
      wrapper: ({ children }) => <UserProvider>{children}</UserProvider>,
    });

    await waitFor(
      () => {
        expect(result.current.user).not.toBeNull();
      },
      { timeout: 3000 },
    );

    expect(result.current.user?.username).toBe("John123");
    expect(result.current.userType).toBe("Admin");
  });

  test("falls back to Viewer if backend returns error", async () => {
    getAccessToken.mockReturnValue("mock-token");

    // Force backend failure
    server.use(
      http.get("*/users/profile/", () => {
        return HttpResponse.json(null, { status: 401 });
      }),
    );

    const { result } = renderHook(() => useUser(), {
      wrapper: ({ children }) => <UserProvider>{children}</UserProvider>,
    });

    await waitFor(() => {
      expect(result.current.userType).toBe("Viewer");
    });
  });
});
