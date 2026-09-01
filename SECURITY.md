# VOUCH security notes

VOUCH is a hackathon prototype, not a production authorization product.

## Deny by default

Missing, contradictory, or untrusted evidence stops the action. A recommendation is not permission.

## Source authority

Official policy and verified system records outrank email, imported documents, and supporting communication. Lower-authority evidence cannot silently override policy.

## Prompt injection handling

Instructions discovered in untrusted evidence are treated as data. They do not become system instructions or authorization policy. The included scenario demonstrates this boundary but does not claim universal prompt-injection prevention.

## Server-side authorization

Only the server advances the state machine. Approval-required actions cannot execute before an approval record exists. Blocked actions cannot jump to execution through frontend manipulation.

## Human approval

Human approval and rejection are explicit audited transitions. The interface does not pressure the user to approve.

## Post-action verification

Execution success is provisional. Expected and actual states are compared after the action. Failure reduces trust and authority and prevents related automatic continuation.

## Trust demotion

Promotion is conservative. Verification failure causes an immediate score reduction and can lower the autonomy level.

## Session isolation

Demo state is scoped per server-side session. Production deployment should add signed, secure, HTTP-only session cookies, durable storage, retention policy, and access control.

## Data and claims

No real transactions are executed. Audit events are append-only within the running application; VOUCH does not claim immutable storage.