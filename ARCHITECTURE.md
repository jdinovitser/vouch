# VOUCH architecture

## Invariant

**The LLM recommends. The authorization layer decides.**

Model output cannot grant permission. Server-side policy independently enforces whether an action can execute.

## Layers

1. **Agent orchestration** — the Strands adapter gathers evidence and calls typed tools.
2. **Evidence** — each source has an authority rank, verification state, relevance, confidence, and finding.
3. **Risk** — actions are classified LOW, MEDIUM, or HIGH and paired with reversibility.
4. **Authority** — a deterministic engine combines evidence, risk, trust, autonomy, policy, and reversibility into EXECUTE, APPROVAL_REQUIRED, or BLOCKED.
5. **Action** — execution is only reachable through a valid authorization state.
6. **Verification** — expected post-action state is compared with actual state.
7. **Trust** — verified success increases trust conservatively; failure reduces trust and authority immediately.
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

## Session isolation

Trust, evidence, approvals, audit records, history, and active scenario state are held in a server-side session map. No mutable action state is shared between session IDs. A production implementation should use a durable, encrypted session store.

## AWS integration

The optional AWS path is designed around Strands Agents SDK, Amazon Bedrock inference, and AgentCore/CloudWatch observability. Demo outcomes remain deterministic so a model failure cannot change the expected safety decision.

## Observability

The operational view surfaces decisions and state transitions rather than hidden reasoning. A production AgentCore integration should emit agent invocation, tool call, authorization, execution, verification, failure, latency, and model-usage telemetry.