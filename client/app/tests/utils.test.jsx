import { describe, it, expect } from "vitest";
import { getNavigationConfig } from "../src/components/constants/utils";

describe("getNavigationConfig()", () => {
  it("returns viewer config (index 0) when userType is 0 or unknown", () => {
    const config0 = getNavigationConfig(0);
    const configUnknown = getNavigationConfig(999);
    expect(config0).toEqual([{}]);
    expect(configUnknown).toEqual([{}]);
  });

  it("returns user navigation config when userType is 1", () => {
    const config = getNavigationConfig(1);

    // Top-level items
    expect(config).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Home", to: "/userdashboard" }),
        expect.objectContaining({ name: "Cover Letter", to: "/coverletter" }),
      ])
    );

    // Nested submenus under "Jobs"
    const jobsMenu = config.find((i) => i.name === "Jobs");
    expect(jobsMenu).toBeDefined();
    expect(jobsMenu.submenus).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "View Jobs", to: "/jobs" }),
        expect.objectContaining({ name: "Your Applications", to: "/applications" }),
      ])
    );
  });
});