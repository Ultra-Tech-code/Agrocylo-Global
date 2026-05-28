import { describe, expect, it } from "vitest";
import { classifyError, toAppError } from "@/lib/errorHandler";

describe("errorHandler", () => {
  it("classifies network errors", () => {
    expect(classifyError(new Error("Failed to fetch resource"))).toBe("network");
  });

  it("classifies wallet errors", () => {
    expect(classifyError(new Error("User rejected wallet signature"))).toBe("wallet");
  });

  it("returns localized details with recovery docs", () => {
    const details = toAppError(new Error("Validation required"));

    expect(details.category).toBe("validation");
    expect(details.title.length).toBeGreaterThan(0);
    expect(details.recovery.length).toBeGreaterThan(0);
    expect(details.docsUrl).toContain("USER_GUIDE");
  });
});
