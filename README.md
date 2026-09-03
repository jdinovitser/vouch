# VOUCH

> **The AI that looks out for people.**

VOUCH gives a group of people an AI teammate they can safely delegate to. The agent handles routine work; VOUCH provides a trusted second set of eyes before important actions, brings the group back into the decision when necessary, and verifies what happened afterward.

Underneath that human experience, VOUCH turns an agent's verified track record into bounded, revocable authority while evaluating every request again against current evidence, risk, policy, context, and hard safety limits.

## The problem

AI agents can give nonprofits, schools, libraries, local organizations, and other community-serving teams more capacity. But when an agent can act on someone's behalf, people should not have to choose between useful automation and staying in control.

Capability is not the same as permission. Consequential actions need a separate, auditable answer to “should this agent be allowed to perform this task now—and does a person need to decide?”

## The solution

VOUCH gives people that backup through a clear lifecycle:

```text
REQUEST → INVESTIGATE → EVIDENCE → RISK → AUTHORITY → ACTION → VERIFY → TRUST
                                                   ▲                 │
                                                   └──── NEXT ACTION ┘
```

The outcome of each fresh authorization decision can be:

- **EXECUTE** — routine work can proceed within the boundaries people established.
- **APPROVAL REQUIRED** — the agent can help, but a person must make the final decision.
- **BLOCKED** — the evidence is conflicting, untrusted, insufficient, or unsafe.

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

Approval-required actions stop in `APPROVAL_REQUIRED`. The server creates an approval record bound to the exact session, action instance, case, case version, and evidence hash. Immediately before execution, VOUCH reevaluates policy and authority, then consumes the approval once. Rejection cancels and audits the action.

## Post-action verification

An API success is not completion. The protected server mutation is committed to Postgres, then VOUCH reloads the case and claims-ledger state from Postgres and compares expected with observed values. Failure stops the workflow, creates human review work, records the result, and demotes autonomy.

## Durable professional state

The professional workflow no longer uses an in-memory session map as its source of truth. A versioned Postgres record persists cases, evidence, recommendations, authority decisions, executions, verifications, approvals, trust events, audit events, and metrics across browser refreshes and server restarts.

## Prompt injection demonstration

The controlled prompt-injection scenario includes an instruction inside an untrusted document. VOUCH treats it as data, not authority. This demonstrates the architectural boundary; it is not a claim of complete protection against all prompt injection.

## AWS and Strands

`server/agent/strands.ts` contains the real TypeScript Strands `Agent` and Amazon Bedrock `BedrockModel` path. The agent uses typed inspection tools and produces a structured recommendation. That recommendation is recorded, but the deterministic VOUCH authority engine independently decides `EXECUTE`, `APPROVAL_REQUIRED`, or `BLOCKED`.

Without AWS credentials the complete prototype runs as `DEMO — Deterministic VOUCH Evaluator`. When `VOUCH_ENABLE_AWS=true`, `AWS_REGION`, and `BEDROCK_MODEL_ID` are configured, VOUCH attempts a real Strands + Bedrock invocation. The UI reports `AWS LIVE` only after that invocation succeeds; failures remain clearly labeled as deterministic fallback.

## Demo scenarios

- $124 duplicate-charge autonomous resolution
- Conflicting evidence and resolution
- Human authorization
- Untrusted instruction / prompt injection
- Claims-ledger verification failure and trust demotion
- Monitored recovery and authority restoration
- Restored autonomous action in the same account-operation class

The guided demo is driven by actual backend session state and proves `PROVE → EARN → ACT → VERIFY → ADJUST`, including authority loss and conditional recovery. It can be reset to the initial T2 state. Presentation controls never grant authority.

## Product routes

- `/` — human-centered product landing page
- `/why-vouch` — why people and community-serving groups need a trusted backup
- `/how-it-works` — human decision lifecycle and graduated autonomy
- `/demo` — interactive people-in-control lifecycle
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

This is a hackathon prototype. Protected demo actions mutate seeded claims records in the project Postgres database rather than production financial or identity systems. Session state and server-bound approval/resolution records persist across application restarts until the user explicitly resets the demo session.

## Future work

- Deploy the Strands runtime to Amazon Bedrock AgentCore.
- Persist trust and append-only audit records in DynamoDB.
- Add CloudWatch traces for tool calls, decisions, execution, verification, latency, and model usage.
- Introduce scoped policy packages and cryptographically signed human approvals.