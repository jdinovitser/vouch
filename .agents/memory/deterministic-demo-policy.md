---
name: Deterministic demo policy
description: Why key hackathon scenarios must remain invariant under general authority rules.
---

The named demo scenarios’ expected safety outcomes are policy invariants. General risk/trust thresholds may govern ordinary actions, but must not change a scripted BLOCK, APPROVAL_REQUIRED, post-resolution EXECUTE, demotion, or monitored-recovery outcome.

**Why:** The live story depends on repeatable safety behavior and an honest PROVE → EARN → ACT → VERIFY → ADJUST arc. A generic threshold can undermine either the safety decision or the visible authority consequence.

**How to apply:** When changing authority logic, preserve scenario-specific constraints. Treat trust as one input to a fresh decision, never as permission. Recovery must represent verified monitored outcomes, not client input or a bypass. Cover the full arc with regression tests and an end-to-end API smoke sequence.