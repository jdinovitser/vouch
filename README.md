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


## Submission video script — Good Neighbor story

This is the five-minute narration for the submission video. The spoken story should follow the same human-first sequence as the `/judges` experience: a community need, useful agent work, a VOUCH decision, and proof of the outcome. Community examples below are potential use cases, not customer claims.

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

### 3:55–4:35 — Show the safety boundary

“The same boundary applies when evidence is unsafe or unclear. Conflicting evidence stays blocked until a person resolves the conflict. An untrusted attachment that says to ignore policy is treated as data, not authority, and the protected record remains unchanged. Higher trust never overrides current policy, evidence, risk, or hard safety limits.

That gives the team honest outcomes: routine work can execute within bounds, important work can require a human, and unsafe work can be blocked. In every case, the decision and the reason are visible.”

**On screen:** Run the conflicting-evidence or prompt-injection scenario and show `BLOCKED`, `NO MUTATION`, and the audit trail.


### 4:35–5:00 — Close on the human benefit

“VOUCH is not asking communities to choose between useful AI and human responsibility. It lets a community-serving team gain capacity while keeping people in control of what matters.

The agent helps. VOUCH checks. A person decides when necessary. The outcome is verified. And over time, the agent can earn carefully bounded authority by proving that its work is reliable.

AI can do more for us. VOUCH helps make sure it does it with us—not instead of us. That is VOUCH: a little backup for people and communities using AI agents.”


### 0:00–0:40 — Start with the people

“A community-serving team has more work than its staff can absorb. Maybe a nonprofit is helping families, a school is coordinating support, or a library is connecting people with resources. The details vary, but the need is familiar: people need help, and the team needs more capacity without handing responsibility to a machine.

That is the idea behind VOUCH. AI can help with routine work. But when an agent is about to act on someone’s behalf, nobody should have to face that decision alone. VOUCH is the trusted second set of eyes that looks out for the people being helped.”

**On screen:** Open on the VOUCH landing page, then move to the community-capacity section. Say explicitly that these are potential contexts for the product, not existing customer deployments.


### 2:10–3:05 — Let VOUCH have the person’s back

“Now the need is more consequential: a $1,240 refund. The agent may have a recommendation, but that amount exceeds the autonomous authority it has earned. VOUCH has your back. It pauses before changing a shared record and brings a person into the decision.

This is not a rubber stamp and it is not a bypass. The server creates a human-authorization record tied to this exact session, case, action, case version, evidence, and time window. The person can approve or decline. If they decline, the action is not executed and autonomous authority does not change. If they approve, the protected server performs only that exact action once.

The point is not to stop the agent from helping. It is to return an important choice to the person responsible for the people being served.”

**On screen:** Run the human-refund scenario, show `APPROVAL REQUIRED`, approve or decline the action, then show the authorization provenance and audit event.


### 3:05–3:55 — Prove what happened

“An API response is not proof that the work succeeded. After a protected mutation, VOUCH reloads the case and claims ledger from Postgres and compares the expected state with the observed state. The durable record includes the case, recommendation, decision, approval, execution, verification, trust event, and audit history.

When the result matches, the outcome is verified. Verified autonomous work can earn more bounded authority for the same kind of work. That authority is revocable and still checked fresh on every request. Human approval helps resolve that case, but it does not expand autonomous authority.

When the result does not match—say the system expected a $124 ledger update but a fresh read finds $0—VOUCH treats that as a failure, creates human review work, records the mismatch, and reduces authority immediately. The agent earns capability through demonstrated results, not through confidence or a permanent whitelist.”

**On screen:** Run the verification-failure scenario, show the expected-versus-actual proof, the trust/authority reduction, and the durable history.


### 1:25–2:10 — Show what is real underneath

“The agent path is built with the TypeScript Strands Agents SDK and Amazon Bedrock. Strands has read-only typed inspection tools for the case and its evidence. It can investigate and produce a structured recommendation with evidence references.

But the recommendation is not permission. The important boundary is simple: the agent recommends; VOUCH authorizes. The server independently evaluates current evidence, risk, policy, conflicts, reversibility, and the authority the agent has earned. The model cannot approve its own action, change a claims record, change trust, or write the audit history.”

**On screen:** Show the Strands recommendation and provenance, then the separate VOUCH authority decision. If the real Bedrock call is unavailable, leave the UI’s deterministic evaluator label visible; AWS LIVE appears only after a successful Strands and Bedrock invocation.


### 0:40–1:25 — Give the team useful capacity

“For this demonstration, we’ll follow a community-serving team working through repetitive claims cases. This is a seeded evaluation dataset, not a claim about customer results. The team has a queue, an AI agent can investigate the routine cases, and people can spend their limited time on the decisions that actually need judgment.

Here is the first case: a $124 duplicate-charge claim. The agent gathers the case, transaction, customer history, policy, and document evidence. It is doing useful work—not just generating an answer. It recommends a bounded resolution and points back to the evidence it used.”

**On screen:** Open `/judges`, show the claims queue, select the routine duplicate-charge case, and show the evidence references and recommendation panel.
