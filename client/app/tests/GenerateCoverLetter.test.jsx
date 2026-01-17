import { render, screen, fireEvent, act } from "@testing-library/react";
import GenerateCoverLetter from "../src/components/GenerateCoverLetter/GenerateCoverLetter";

jest.useFakeTimers();

const mockProfile = {
  name: "John Doe",
  skills: "React,Node.js,Python",
};

describe("GenerateCoverLetter Component", () => {
  test("renders the component correctly", () => {
    render(<GenerateCoverLetter profile={mockProfile} />);
    expect(screen.getByTestId("cover-letter-component")).toBeInTheDocument();
    expect(screen.getByText("AI Cover Letter Generator")).toBeInTheDocument();
  });

  test("does not generate letter if job description is empty", () => {
    render(<GenerateCoverLetter profile={mockProfile} />);
    const button = screen.getByTestId("generate-button");
    fireEvent.click(button);
    expect(screen.queryByTestId("generated-letter")).not.toBeInTheDocument();
  });

  test("generates a cover letter after timeout", async () => {
    render(<GenerateCoverLetter profile={mockProfile} />);
    const textarea = screen.getByTestId("job-desc-input");
    const button = screen.getByTestId("generate-button");

    fireEvent.change(textarea, { target: { value: "Frontend Developer Role" } });

    act(() => {
      fireEvent.click(button);
      jest.runAllTimers();
    });

    const letter = await screen.findByTestId("generated-letter");
    expect(letter).toBeInTheDocument();
    expect(letter.textContent).toContain("Dear Hiring Manager");
    expect(letter.textContent).toContain("John Doe");
  });

  test("uses default name if profile name is missing", async () => {
    render(<GenerateCoverLetter profile={{ skills: "Python,Django" }} />);
    const textarea = screen.getByTestId("job-desc-input");
    const button = screen.getByTestId("generate-button");

    fireEvent.change(textarea, { target: { value: "Backend Engineer Role" } });

    act(() => {
      fireEvent.click(button);
      jest.runAllTimers();
    });

    const letter = await screen.findByTestId("generated-letter");
    expect(letter.textContent).toContain("Sincerely,\nApplicant");
  });
});
