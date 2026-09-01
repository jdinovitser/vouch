---
name: Deterministic demo policy
description: Why key hackathon scenarios must remain invariant under general authority rules.
---

The named demo scenarios’ expected safety outcomes are policy invariants. General risk/trust thresholds may govern ordinary actions, but must not change a scripted BLOCK, APPROVAL_REQUIRED, post-resolution EXECUTE, demotion, or monitored-recovery outcome.

**Why:** The live story depends on repeatable safety behavior and an honest EARN → ACT → VERIFY → LOSE → RECOVER arc. A generic threshold can undermine either the safety decision or the visible authority consequence.

**How to apply:** When changing authority logic, preserve scenario-specific constraints. Recovery must represent verified monitored outcomes, not client input or a generic bypass. Cover the full arc with regression tests and an end-to-end API smoke sequence.