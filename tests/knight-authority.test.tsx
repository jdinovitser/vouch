import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CelebrationKnight, KnightAuthority, authorityKnightLabels } from "../client/Knight";

describe("Knight authority progression", () => {
  it("uses the four canonical authority labels", () => {
    expect(authorityKnightLabels).toEqual({
      T1: { label: "TRAINEE", role: "OBSERVE" },
      T2: { label: "SQUIRE", role: "RECOMMEND" },
      T3: { label: "WARRIOR", role: "ACT" },
      T4: { label: "KNIGHT", role: "DELEGATE" },
    });
  });

  it("uses the trainee artwork for T1", () => {
    const markup = renderToStaticMarkup(<KnightAuthority level="T1" />);
    expect(markup).toContain("T1 TRAINEE");
    expect(markup).toContain('data-authority-artwork="T1"');
    expect(markup).toContain('data-equipment="unarmored"');
  });

  it("uses the training squire artwork for T2", () => {
    const markup = renderToStaticMarkup(<KnightAuthority level="T2" />);
    expect(markup).toContain("T2 SQUIRE");
    expect(markup).toContain('data-authority-artwork="T2"');
    expect(markup).toContain('data-equipment="training sword shield"');
  });

  it("uses the armored warrior artwork for T3", () => {
    const markup = renderToStaticMarkup(<KnightAuthority level="T3" />);
    expect(markup).toContain("T3 WARRIOR");
    expect(markup).toContain('data-authority-artwork="T3"');
    expect(markup).toContain('data-equipment="armor shield sword"');
  });

  it("uses the golden knight artwork for T4", () => {
    const markup = renderToStaticMarkup(<KnightAuthority level="T4" />);
    expect(markup).toContain("T4 KNIGHT");
    expect(markup).toContain('data-authority-artwork="T4"');
    expect(markup).toContain('data-equipment="golden armor shield sword cape"');
  });

  it("maps each authority tier to one distinct artwork", () => {
    const t4 = renderToStaticMarkup(<KnightAuthority level="T4" />);
    const t3 = renderToStaticMarkup(<KnightAuthority level="T3" />);
    const t2 = renderToStaticMarkup(<KnightAuthority level="T2" />);
    const t1 = renderToStaticMarkup(<KnightAuthority level="T1" />);
    expect(t4).not.toContain('data-authority-artwork="T3"');
    expect(t3).not.toContain('data-authority-artwork="T2"');
    expect(t2).not.toContain('data-authority-artwork="T1"');
    expect(t1).not.toContain('data-authority-artwork="T4"');
  });

  it("keeps celebration separate from server authority tiers", () => {
    const markup = renderToStaticMarkup(<CelebrationKnight />);
    expect(markup).toContain('data-authority-artwork="T5"');
    expect(markup).toContain("vouch-mounted-knight-chibi-final.png");
    expect(markup).not.toContain("authority-knight-caption");
  });
});