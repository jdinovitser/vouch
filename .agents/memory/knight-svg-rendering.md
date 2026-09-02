---
name: Knight SVG rendering
description: Why VOUCH Knight pose compositions use an inline SVG renderer instead of nested SVG image assets.
---

Render composed VOUCH Knight poses inline in the document. Do not rely on an SVG loaded through an `img` element to fetch another SVG with an internal `image` reference.

**Why:** Browsers suppress the nested external SVG reference in image-document mode, which leaves only the pose props visible and makes the canonical knight disappear.

**How to apply:** Extend the shared inline Knight renderer for new poses. Keep standalone SVG exports self-contained if they must also work as downloadable assets.

Workflow-state illustrations must change the Knight's actual stance by repositioning limbs, shield, and held objects. Avoid detached weapons, floating badges, or decorative props around an unchanged base character.

**Why:** Prop-heavy compositions looked disconnected and amateurish; the mounted-action illustration was explicitly rejected.

**How to apply:** Build workflow states from the canonical vector anatomy and attach any necessary tool to the relevant hand. Prefer body language over additional scene objects.

Authority-tier visuals are a separate progression and must derive only from the real server-provided autonomy level. T1 is unarmored with no equipment; T2 adds substantial armor but no shield or sword; T3 adds shield and sword; T4 is fully armored and mounted on a static horse.

**Why:** The Knight communicates current authority; a separate client-side level could drift from the authorization engine. The T4 horse is a credential marker, not an action animation.

**How to apply:** Render tiers through the shared authority component using the session autonomy value. Never let Knight state determine or mutate authority, and do not add riding animation or game mechanics.

T5 is a celebration illustration, not an authority tier. Use it only after a verified proof completes; the server authority model remains T1–T4 and must still be shown separately.

**Why:** Celebration communicates a successful lifecycle outcome without inventing a capability level the authorization engine does not issue.

**How to apply:** Render T5 from verified completion state only. Never store, label, or evaluate T5 as agent authority.

Knight props have fixed product meanings: shield = policy, sword = earned authority, horse = delegated authority, ledger = verified history, and gate = the authorization boundary. Never add a crown.

**Why:** The mascot is an explanatory system, not decoration or a game layer. Stable semantics let users read authority changes without weakening the enterprise security model.

**How to apply:** Show only server-derived equipment and real ledger events. Keep human approval visually distinct, and use the gate only for actual allow, approval-required, or block outcomes.