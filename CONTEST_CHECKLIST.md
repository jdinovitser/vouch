# VOUCH contest readiness

Status is based on observed behavior, not feature names.

## Proven

- **Professional Agents track fit** — claims operations professionals and repetitive duplicate-charge resolution are the primary product story.
- **Strands requirement** — the application instantiates the Strands Agents SDK, exposes read-only typed tools, and requests structured recommendation output.
- **Professional agent behavior** — the agent investigates evidence, checks policy context, calculates a recommendation, and produces evidence references.
- **Independent authority** — model output cannot authorize, execute, update trust, or mutate audit state.
- **Protected mutation** — the server performs case and refund-ledger changes only after a fresh authorization check.
- **Durable persistence** — Postgres stores cases, evidence, recommendations, decisions, approvals, executions, verifications, trust, metrics, and audit.
- **Independent verification** — verification reloads the resulting case from Postgres and compares expected with observed state.
- **Human escalation** — approvals are explicit, audited, case/action/evidence/version-bound, and single-use.
- **Safety boundary** — conflicts and prompt injection block mutation; high trust does not override policy.
- **Adaptive authority** — verified success can expand authority; failed durable-state verification immediately reduces it.
- **Live/demo honesty** — AWS LIVE is shown only after a successful Strands + Bedrock invocation.
- **Impact metrics** — rates and counts derive from persisted case outcomes and are labeled as a seeded evaluation dataset.

## Partially proven

- **Amazon Bedrock live happy path** — credentials, region, model ID, SDK construction, and real invocation are configured. The latest observed invocation reached Bedrock but was rejected because the account had exhausted its daily token quota. The application correctly used the labeled deterministic fallback.
- **Public repository readiness** — code and architecture are documented locally, but public repository visibility has not been verified from this environment.
- **Live demo readiness** — development workflow is verified; published production availability must be confirmed after publishing.
- **Screenshots and demo video** — the judge flow is implemented, but final submission media still needs capture.
- **Builder story bonus** — eligibility is known, but publication has not been completed or verified.

## Missing external confirmation

- Professional Agents track selection in the submission form.
- AWS Builder ID confirmation.
- Public repository URL.
- Published demo URL.
- Uploaded 90-second demo video and final screenshots.
- Builder story URL, if pursuing the bonus.

## Submission deadline

September 14, 2026 at 8:00 PM Eastern / 5:00 PM Pacific, based on the contest page previously reviewed for this project.