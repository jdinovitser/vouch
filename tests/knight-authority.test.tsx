import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { KnightAuthority, authorityKnightLabels } from "../client/Knight";

describe("Knight authority progression", () => {
  it("uses the four canonical authority labels", () => {
    expect(authorityKnightLabels).toEqual({
      T1: { label: "NOT TRUSTED", role: "OBSERVE" },
      T2: { label: "IN TRAINING", role: "RECOMMEND" },
      T3: { label: "SQUIRE", role: "BOUNDED ACTION" },
      T4: { label: "FULL KNIGHT", role: "DELEGATED ACTION" },
    });
  });

  it("renders training gear at T2 without a sword or horse", () => {
    const markup = renderToStaticMarkup(<KnightAuthority level="T2" />);
    expect(markup).toContain("IN TRAINING");
    expect(markup).not.toContain("knight-sword");
    expect(markup).not.toContain("knight-horse");
  });

  it("adds a real sword at T3 without adding the horse", () => {
    const markup = renderToStaticMarkup(<KnightAuthority level="T3" />);
    expect(markup).toContain("SQUIRE");
    expect(markup).toContain("knight-sword");
    expect(markup).not.toContain("knight-horse");
  });

  it("adds the static horse only at T4", () => {
    const markup = renderToStaticMarkup(<KnightAuthority level="T4" />);
    expect(markup).toContain("FULL KNIGHT");
    expect(markup).toContain("knight-sword");
    expect(markup).toContain("knight-horse");
  });
});