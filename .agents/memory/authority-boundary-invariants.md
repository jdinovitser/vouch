---
name: Authority boundary invariants
description: Non-negotiable boundaries for conflict resolution and live AWS status.
---

Conflict resolution must be a single-use server record bound to the exact session, action, scenario, and evidence version. Client claims must never confer authority.

AWS LIVE status must appear only after a successful real Strands + Bedrock invocation; configuration flags or attempted calls are not sufficient.

**Why:** These boundaries prevent authorization bypass and ensure judges can distinguish real model use from deterministic fallback.

**How to apply:** Preserve both invariants in future API, UI, agent-adapter, and demo changes, with regression tests for bypass, replay, mismatches, and failed live invocations.