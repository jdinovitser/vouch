# VOUCH architecture

## Invariant

**The LLM recommends. The authorization layer decides.**

Model output cannot grant permission. Server-side policy independently evaluates every request. Verified history informs current authority, but past success or approval never authorizes a future request by itself.

## Layers

1. **Agent orchestration** — the real Strands + Bedrock path uses typed inspection tools to produce a structured recommendation when AWS is configured; deterministic demo mode remains available.
2. **Evidence** — each source has an authority rank, verification state, relevance, confidence, and finding.
3. **Risk** — actions are classified LOW, MEDIUM, or HIGH and paired with reversibility.
4. **Authority** — a deterministic engine combines verified history, current evidence, risk, context, policy, hard limits, and reversibility into EXECUTE, APPROVAL_REQUIRED, or BLOCKED.
5. **Action** — execution is only reachable through a valid authorization state.
6. **Verification** — expected post-action state is compared with actual state.
7. **Trust** — verified success increases trust conservatively; failure reduces trust and authority immediately; monitored recovery evidence can restore a previously earned level.
8. **Audit** — every consequential decision is appended to the session audit record.

## State machine

The workflow uses explicit transitions. A blocked action cannot jump to execution. Approval-required actions cannot execute without an approval record. Verification failure must flow into a trust update.

## Agent tools

Tools expose structured inputs and outputs:

- `get_evidence`
- `check_authority`
- `assess_risk`
- `check_policy`
- `evaluate_action`
- `execute_action`
- `verify_outcome`
- `update_trust`
- `request_human_approval`

## Server-bound resolution

Conflict resolution is represented by a single-use server record bound to session ID, action ID, scenario ID, and a hash of the exact evidence state. Client-supplied resolution flags are ignored. A changed action or changed evidence requires a new resolution.

## Session isolation

Trust, evidence, approvals, audit records, history, and active scenario state are held in a server-side session map. No mutable action state is shared between session IDs. A production implementation should use a durable, encrypted session store.

## Adaptive authority feedback loop

The deterministic demo begins at T2 RECOMMEND. A verified low-risk action crosses the T3 ACT threshold. A controlled verification failure then demotes the same agent to T2, causing the same medium-risk action class to require approval. A subsequent monitored recovery sequence verifies three bounded outcomes and restores T3. The authority engine—not the client and not the model—considers that restored standing when it freshly evaluates the next action.

The recovery sequence is explicit demo policy, not a generic trust shortcut. It represents an evidence bundle of monitored outcomes and is covered by regression tests and an end-to-end API smoke sequence. High-risk, irreversible, conflicted, and flagged unsafe actions remain bounded by policy regardless of standing.

## AWS integration

The optional AWS path instantiates the TypeScript Strands `Agent` with an Amazon Bedrock `BedrockModel`. AWS LIVE status is established only after a successful invocation. AgentCore and CloudWatch remain future deployment/observability work. Authorization outcomes remain deterministic so model output cannot grant permission.

## Observability

The operational view surfaces decisions and state transitions rather than hidden reasoning. A production AgentCore integration should emit agent invocation, tool call, authorization, execution, verification, failure, latency, and model-usage telemetry.