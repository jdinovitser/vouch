# VOUCH

> **AI agents do not need unlimited autonomy. They need earned authority.**

VOUCH is an adaptive authority engine for AI agents. It turns an agent's verified track record into bounded, revocable authority while evaluating every request again against current evidence, risk, policy, context, and hard safety limits.

## The problem

Agentic systems usually answer “can the model perform this task?” Capability is not the same as permission. Consequential actions need a separate, auditable answer to “has this agent earned enough authority to perform this task now?”

## The solution

VOUCH enforces a lifecycle:

```text
REQUEST → INVESTIGATE → EVIDENCE → RISK → AUTHORITY → ACTION → VERIFY → TRUST
                                                   ▲                 │
                                                   └──── NEXT ACTION ┘
```

The outcome of each fresh authorization decision can be:

- **EXECUTE** — policy, evidence, risk, and trust permit autonomous action.
- **APPROVAL REQUIRED** — evidence supports the recommendation, but human authority is required.
- **BLOCKED** — evidence is conflicting, untrusted, insufficient, or unsafe.

## Architecture

```text
┌──────────────┐    ┌────────────────┐    ┌──────────────────────┐
│ User request │───▶│ Strands agent  │───▶│ Typed agent tools    │
└──────────────┘    └────────────────┘    └──────────┬───────────┘
                                                     ▼
┌────────────────┐    ┌────────────────┐    ┌──────────────────────┐
│ Evidence layer │───▶│ Risk engine    │───▶│ Authority engine     │
└────────────────┘    └────────────────┘    │ allow / ask / block  │
                                            └──────────┬───────────┘
                                                       ▼
┌────────────────┐    ┌────────────────┐    ┌──────────────────────┐
│ Audit timeline │◀───│ Trust engine   │◀───│ Action + verification│
└────────────────┘    └────────────────┘    └──────────────────────┘
```

**The LLM recommends. The authorization layer decides.**

See [ARCHITECTURE.md](ARCHITECTURE.md) for details.

## Trust model

Trust represents demonstrated operational reliability inside the current policy scope. It is not a personality score and it is never permission by itself.

| Level | Behavior |
| --- | --- |
| T1 — Observe | Inspect and recommend without changing external state |
| T2 — Recommend | Low-risk reversible actions may run; consequential work escalates |
| T3 — Act | Verified medium-risk actions may run within policy |
| T4 — Delegate | Broader approved scopes remain subject to continuous verification |

The deterministic lifecycle begins at trust 84 / T2. A verified bounded action earns T3. Verification failure reduces trust by 15 and demotes authority immediately. A clearly identified monitored recovery sequence can restore the T3 threshold; the same class of action can then execute autonomously again.

## Risk and authority

The deterministic server-side engine considers verified history, current evidence, action risk, source authority, conflicts, reversibility, policy, and hard limits on every request. Frontend state cannot bypass it. Past approval and higher standing do not create a permanent whitelist.

High-risk and irreversible actions remain approval-required. Conflicted evidence and flagged untrusted instructions remain blocked regardless of trust score or autonomy level.

## Human authorization

Approval-required actions stop in `APPROVAL_REQUIRED`. Execution is rejected by the server until a human approval is recorded. Rejection cancels and audits the action.

## Post-action verification

An API success is not completion. VOUCH compares expected and actual state. Failure stops the workflow, records the result, reduces trust, and may demote autonomy.

## Prompt injection demonstration

The controlled prompt-injection scenario includes an instruction inside an untrusted document. VOUCH treats it as data, not authority. This demonstrates the architectural boundary; it is not a claim of complete protection against all prompt injection.

## AWS and Strands

`server/agent/strands.ts` contains the real TypeScript Strands `Agent` and Amazon Bedrock `BedrockModel` path. The agent uses typed inspection tools and produces a structured recommendation. That recommendation is recorded, but the deterministic VOUCH authority engine independently decides `EXECUTE`, `APPROVAL_REQUIRED`, or `BLOCKED`.

Without AWS credentials the complete prototype runs as `DEMO — Deterministic VOUCH Evaluator`. When `VOUCH_ENABLE_AWS=true`, `AWS_REGION`, and `BEDROCK_MODEL_ID` are configured, VOUCH attempts a real Strands + Bedrock invocation. The UI reports `AWS LIVE` only after that invocation succeeds; failures remain clearly labeled as deterministic fallback.

## Demo scenarios

- Safe autonomous action
- Conflicting evidence and resolution
- Human authorization
- Untrusted instruction / prompt injection
- Verification failure and trust demotion
- Monitored recovery and authority restoration
- Restored autonomous action in the same account-operation class

The guided demo is driven by actual backend session state and proves `PROVE → EARN → ACT → VERIFY → ADJUST`, including authority loss and conditional recovery. It can be reset to the initial T2 state. Presentation controls never grant authority.

## Product routes

- `/` — enterprise product landing page
- `/why-vouch` — business problem, value, and ROI mechanics
- `/how-it-works` — lifecycle and graduated autonomy
- `/demo` — interactive earned-autonomy lifecycle
- `/judges` — purpose-built 90-second judging path
- `/architecture` — technical control boundary
- `/control` — live product control center
- `/history` — outcome, trust, authority, and audit history

## Running locally

```bash
npm install
npm run dev
```

Open port 5000. Run checks with:

```bash
npm test
npm run build
```

## Environment variables

Copy `.env.example`. No credentials are required for deterministic demo mode. Never commit AWS credentials.

## Limitations

This is a hackathon prototype. Demo actions operate on a clearly labeled controlled action simulator rather than production financial, identity, or workflow systems. Session state and server-bound resolution records are held in memory and reset with the server.

## Future work

- Deploy the Strands runtime to Amazon Bedrock AgentCore.
- Persist trust and append-only audit records in DynamoDB.
- Add CloudWatch traces for tool calls, decisions, execution, verification, latency, and model usage.
- Introduce scoped policy packages and cryptographically signed human approvals.