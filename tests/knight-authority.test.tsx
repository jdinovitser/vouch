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

  it("renders T1 as an unarmored person without equipment", () => {
    const markup = renderToStaticMarkup(<KnightAuthority level="T1" />);
    expect(markup).toContain("NOT TRUSTED");
    expect(markup).toContain("knight-clothing");
    expect(markup).not.toContain("knight-armor");
    expect(markup).not.toContain("knight-shield");
    expect(markup).not.toContain("knight-sword");
    expect(markup).not.toContain("knight-horse");
  });

  it("renders substantial armor at T2 without a shield, sword, or horse", () => {
    const markup = renderToStaticMarkup(<KnightAuthority level="T2" />);
    expect(markup).toContain("IN TRAINING");
    expect(markup).toContain("knight-armor");
    expect(markup).toContain("knight-helmet");
    expect(markup).not.toContain("knight-shield");
    expect(markup).not.toContain("knight-sword");
    expect(markup).not.toContain("knight-horse");
  });

  it("renders armor, shield, and sword at T3 without the horse", () => {
    const markup = renderToStaticMarkup(<KnightAuthority level="T3" />);
    expect(markup).toContain("SQUIRE");
    expect(markup).toContain("knight-armor");
    expect(markup).toContain("knight-shield");
    expect(markup).toContain("knight-sword");
    expect(markup).not.toContain("knight-horse");
  });

  it("renders a fully equipped mounted knight only at T4", () => {
    const markup = renderToStaticMarkup(<KnightAuthority level="T4" />);
    expect(markup).toContain("FULL KNIGHT");
    expect(markup).toContain("mounted-knight-art");
    expect(markup).toContain("mounted-rider");
    expect(markup).toContain("mounted-saddle");
    expect(markup).toContain("mounted-sheathed-sword");
    expect(markup).toContain("knight-armor");
    expect(markup).toContain("knight-shield");
    expect(markup).toContain("knight-sword");
    expect(markup).toContain("knight-horse");
  });

  it("removes higher-tier equipment when authority is demoted", () => {
    const t4 = renderToStaticMarkup(<KnightAuthority level="T4" />);
    const t3 = renderToStaticMarkup(<KnightAuthority level="T3" />);
    const t2 = renderToStaticMarkup(<KnightAuthority level="T2" />);
    const t1 = renderToStaticMarkup(<KnightAuthority level="T1" />);
    expect(t4).toContain("knight-horse");
    expect(t3).not.toContain("knight-horse");
    expect(t3).toContain("knight-sword");
    expect(t2).not.toContain("knight-sword");
    expect(t2).toContain("knight-armor");
    expect(t1).not.toContain("knight-armor");
  });
});