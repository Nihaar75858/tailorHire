import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import DashboardFooter from "../src/components/Footer/DashboardFooter";

describe("DashboardFooter Component", () => {
  it("renders logo, tagline, and social icons", () => {
    render(<DashboardFooter />);

    // Logo
    const logo = screen.getByAltText(/logo/i);
    expect(logo).toBeInTheDocument();

    // Tagline
    expect(
      screen.getByText(/You're Job-searching begins from here/i)
    ).toBeInTheDocument();

    // Social icons (just check one or two as representatives)
    expect(screen.getByTestId(/facebook-icon/i)).toBeInTheDocument();
    expect(screen.getByTestId(/github-icon/i)).toBeInTheDocument();
  });

  it("renders key footer sections and legal notice", () => {
    render(<DashboardFooter />);

    // Sections
    expect(screen.getByText(/Solutions/i)).toBeInTheDocument();
    expect(screen.getByText(/Support/i)).toBeInTheDocument();
    expect(screen.getByText(/Company/i)).toBeInTheDocument();
    expect(screen.getByText(/Legal/i)).toBeInTheDocument();

    // Legal text
    expect(screen.getByText(/All rights reserved/i)).toBeInTheDocument();
  });
});
