---
name: Knight SVG rendering
description: Why VOUCH Knight pose compositions use an inline SVG renderer instead of nested SVG image assets.
---

Render composed VOUCH Knight poses inline in the document. Do not rely on an SVG loaded through an `img` element to fetch another SVG with an internal `image` reference.

**Why:** Browsers suppress the nested external SVG reference in image-document mode, which leaves only the pose props visible and makes the canonical knight disappear.

**How to apply:** Extend the shared inline Knight renderer for new poses. Keep standalone SVG exports self-contained if they must also work as downloadable assets.