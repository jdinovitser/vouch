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

Authority-tier visuals are a separate progression and must derive only from the real server-provided autonomy level. T1/T2 have no sword, T3 introduces the sword, and T4 alone may include a static horse.

**Why:** The Knight communicates current authority; a separate client-side level could drift from the authorization engine. The T4 horse is a credential marker, not an action animation.

**How to apply:** Render tiers through the shared authority component using the session autonomy value. Never let Knight state determine or mutate authority, and do not add riding animation or game mechanics.

Knight props have fixed product meanings: shield = policy, sword = earned authority, horse = delegated authority, ledger = verified history, and gate = the authorization boundary. Never add a crown.

**Why:** The mascot is an explanatory system, not decoration or a game layer. Stable semantics let users read authority changes without weakening the enterprise security model.

**How to apply:** Show only server-derived equipment and real ledger events. Keep human approval visually distinct, and use the gate only for actual allow, approval-required, or block outcomes.