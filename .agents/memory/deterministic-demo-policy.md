---
name: Deterministic demo policy
description: Why key hackathon scenarios must remain invariant under general authority rules.
---

The named demo scenarios’ expected safety outcomes are policy invariants. General risk/trust thresholds may govern ordinary actions, but must not change a scripted BLOCK, APPROVAL_REQUIRED, or post-resolution EXECUTE outcome.

**Why:** The live story depends on repeatable safety behavior. A broadly correct threshold can still undermine the demonstration by auto-executing an action whose scenario represents a specific approval policy.

**How to apply:** When adding or changing authority logic, preserve scenario-specific policy constraints and cover the expected outcomes with regression tests and an end-to-end API smoke sequence.