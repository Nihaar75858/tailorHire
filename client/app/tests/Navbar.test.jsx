import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach} from "vitest";
import Navbar from "../src/components/Navbar/Navbar";
import { useUser } from "../src/components/hooks/useAuth";
import { getNavigationConfig } from "../src/components/constants/utils";
import { MemoryRouter } from "react-router-dom";

// Mock dependencies
vi.mock("../src/components/hooks/useAuth", () => ({
  useUser: vi.fn(), // 👈 ensures it's a mock function
}));

vi.mock("../src/components/constants/utils", () => ({
  getNavigationConfig: vi.fn(), // 👈 ensures it's a mock function
}));

describe("Navbar Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders logo and default Viewer nav links", () => {
    useUser.mockReturnValue({ userType: "Viewer" });
    getNavigationConfig.mockReturnValue([
      { name: "Products", submenus: null },
      { name: "About", to: "/about" },
    ]);

    render(<Navbar />);

    // Expect the logo and the link text
    expect(screen.getByAltText("")).toBeInTheDocument();
    expect(screen.getByText("Products")).toBeInTheDocument();
  });

  test("renders Sign in button for Viewer", () => {
    useUser.mockReturnValue({ userType: "Viewer" });
    getNavigationConfig.mockReturnValue([{ name: "Products", to: "#" }]);

    render(<Navbar />);
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
  });

  test("shows sidebar when user clicks menu button (logged-in user)", () => {
    useUser.mockReturnValue({ userType: "Admin" });
    getNavigationConfig.mockReturnValue([{ name: "Home", to: "/home" }]);

    render(<Navbar />);
    const menuButton = screen.getAllByRole("button")[0];
    fireEvent.click(menuButton);

    expect(screen.getByText("Menu")).toBeInTheDocument();
  });

  test("triggers logout when Sign out is clicked", async () => {
    useUser.mockReturnValue({ userType: "Admin" });
    getNavigationConfig.mockReturnValue([{ name: "Home", to: "/home" }]);

    delete window.location;
    window.location = { href: "" };

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    // Open sidebar
    fireEvent.click(screen.getByLabelText(/open sidebar menu/i));

    // Wait for sidebar to appear
    const signOutButton = await screen.findByText(/sign out/i);

    // Click sign out
    fireEvent.click(signOutButton);

    // Assert redirect happened
    expect(window.location.href).toBe("/");
  });
});
