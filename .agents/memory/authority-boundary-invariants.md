---
name: Authority boundary invariants
description: Non-negotiable boundaries for human authorization, conflict resolution, and live AWS status.
---

Conflict resolution must be a single-use server record bound to the exact session, action, scenario, and evidence version. Client claims must never confer authority.

Human authorization is a server-held, action-bound decision—not a VOUCH bypass. Approved work must remain distinguishable from autonomous work in action and audit provenance, and a professional decline must preserve non-execution without changing autonomous authority.

AWS LIVE status must appear only after a successful real Strands + Bedrock invocation; configuration flags or attempted calls are not sufficient.

**Why:** These boundaries prevent authorization bypass and ensure judges can distinguish autonomous execution, professional judgment, and real model use from deterministic fallback.

**How to apply:** Preserve these invariants in future API, UI, agent-adapter, and demo changes, with regression tests for bypass, replay, stale bindings, declines, provenance, and failed live invocations.