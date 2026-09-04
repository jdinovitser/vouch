# VOUCH — 4-Minute Contest Demo Script

**Target runtime:** 3:45–3:58

## Before recording

1. Open `/demo`.
2. Scroll to the guided demo controls.
3. Click **Reset proof**.
4. Click **Home** in the top navigation.
5. Start recording with the homepage hero visible.
6. Only say **AWS LIVE** if that exact status appears. Otherwise use the fallback line in the script.

| What webpage to be on | What to show / click | What to say |
|---|---|---|
| **0:00–0:25 — Home** | Show the full hero. Keep the mascot, **EARNED RESPONSIBILITY**, and `HELP · PROVE · VERIFY · EARN` visible. Do not click yet. | **“A food pantry is running out of supplies. Disaster-relief volunteers are overwhelmed. A neighborhood team has more people asking for help than it has people to answer them. People need help—and the people helping them urgently need more hands.”** |
| **0:25–0:45 — Home** | Point to the mascot and earned-responsibility card. Click **Why VOUCH** in the top navigation. | “AI agents can become those extra hands. But when an agent acts for a community, usefulness is not enough. The agent recommending an action should never authorize itself. VOUCH lets AI help while people remain responsible for what matters.” |
| **0:45–1:05 — Why VOUCH** | Pause on **People need help. Teams need more hands.** Scroll to **The Teammate’s Journey** and show all four knights: T1, T2, T3, T4. | “This is what makes VOUCH special: verified behavior becomes bounded responsibility. The teammate starts small and proves itself through useful work. Success moves it forward. Failure moves it back. Higher stakes return to people.” |
| **1:05–1:30 — Architecture** | Click **Architecture** in the top navigation. Show the top diagram. Point left to **Strands + Bedrock**, center to the **VOUCH Gate**, then right to the **Authority Layer**. Point to `Recommendation only` and `EXECUTE · APPROVAL REQUIRED · BLOCKED`. | “The contest requires Strands Agents. VOUCH uses Strands, Amazon Bedrock, and typed read-only tools to inspect evidence and recommend an action. Then a separate server engine checks policy, risk, and earned limits. **The LLM recommends; VOUCH authorizes.**” |
| **1:30–1:42 — Architecture → Demo** | Click **See it work** in the top navigation. On `/demo`, scroll past the demo heading to the button **Resolve routine $124 claim**. | **If AWS LIVE:** “Strands and Bedrock are live.” **If fallback:** “The Strands and Bedrock path is built in; VOUCH honestly labels today’s deterministic fallback.” Then: “Now I’ll show the full loop.” |
| **1:42–2:12 — Demo: AI helps** | Click **Resolve routine $124 claim**. Wait for completion. Point to `EXECUTE`, `CASE MUTATED`, verification `PASS`, and the `$250 → $500` authority change. | “Someone was charged twice and needs 124 dollars returned. The agent investigates and recommends. VOUCH confirms the request is within its earned limit, executes through the protected server, then reloads Postgres. The help worked. Only after verification passes does responsibility increase from 250 to 500 dollars.” |
| **2:12–2:42 — Demo: a person decides** | Click **Open the $1,240 exception**. Wait. Point to `APPROVAL REQUIRED`, `AUTHORITY NOT EARNED`, and `NO MUTATION`. Click **Approve as human**. | “Now someone needs a 1,240-dollar refund. The AI can help investigate, but it has not earned this decision. VOUCH stops and brings in a person. I’ll approve it. This single-use approval helps this person, but it does not expand the AI’s future authority.” |
| **2:42–3:12 — Demo: trust can be lost** | Click **Run verification-failure case**. Wait. Point to `AUTHORIZED ≠ VERIFIED`, expected `$124`, observed `$0`, and the authority drop to `$100`. Click **Re-evaluate at reduced authority** and point to `APPROVAL REQUIRED`. | “Trust must also mean something when work fails. A fresh database read finds zero instead of 124 dollars. VOUCH records the mismatch and reduces authority to 100. When I try the same work again, it now needs a person. Verified behavior changed the next decision.” |
| **3:12–3:32 — Demo: hard boundary** | Click **Test untrusted claim content**. Wait. Point to the untrusted instruction, `BLOCKED`, and `NO MUTATION`. | “Finally, an attachment says to ignore policy. VOUCH treats it as data, not authority, and blocks the action. Even a trusted teammate cannot cross a boundary the community depends on.” |
| **3:32–3:58 — Demo: finish strong** | Stop clicking. Leave the completed proof, mascot, and authority history visible. Look toward the judges for the final lines. | **“VOUCH is a Good Neighbor Agent because it gives food banks, schools, libraries, nonprofits, and neighborhood teams more capacity without giving away human responsibility. Strands handles agent reasoning; VOUCH enforces authorization, execution, verification, adaptive authority, and audit state outside the model. Give the people doing good another set of hands they can trust. The agent recommends. VOUCH authorizes. Trust is earned.”** |

## Exact click sequence

1. Before recording: `/demo` → **Reset proof** → **Home**
2. Home → **Why VOUCH**
3. Why VOUCH → scroll to **The Teammate’s Journey**
4. Top navigation → **Architecture**
5. Architecture → point to **Strands + Bedrock**
6. Architecture → point to **VOUCH Gate**
7. Architecture → point to **Authority Layer**
8. Top navigation → **See it work**
9. Demo → scroll to **Resolve routine $124 claim**
10. Click **Resolve routine $124 claim**
11. Click **Open the $1,240 exception**
12. Click **Approve as human**
13. Click **Run verification-failure case**
14. Click **Re-evaluate at reduced authority**
15. Click **Test untrusted claim content**
16. Stop clicking and deliver the closing

## What this earns with the judges

- **Technological Implementation:** Genuine Strands Agents SDK use, typed inspection tools, structured recommendations, Amazon Bedrock model path, live end-to-end proof, and a non-trivial server authority system.
- **Design:** A coherent experience connecting human purpose, mascot progression, understandable decisions, live cases, verification, and history.
- **Potential Impact:** A specific solution for groups serving communities—not a generic assistant or unsupported customer claim.
- **Creativity & Originality:** Trust is not a score on a dashboard; verified outcomes change bounded, revocable capability.
- **Presentation:** The video clearly shows who VOUCH is for, why it matters, what makes it different, and the complete working loop.

## Core technology statement

**Required by the contest and implemented:** Strands Agents SDK.

**Implemented model path:** Amazon Bedrock. The interface displays **AWS LIVE** only after a successful real invocation; otherwise it transparently identifies the deterministic fallback.

**Not claimed as currently deployed:** Amazon Bedrock AgentCore. Devpost says AgentCore can strengthen the Technical Implementation score, but it is not required.