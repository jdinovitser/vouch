import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowRight, BadgeCheck, Ban, BookOpen, Check, ChevronDown, ChevronRight,
  CircleHelp, Clock3, Command, FileCheck2, Fingerprint, Gauge, History, LockKeyhole,
  Menu, Play, Radio, RefreshCw, ScanSearch, ShieldAlert, ShieldCheck, Sparkles, X,
} from "lucide-react";
import type { DemoScenario, SessionState, ActionRecord, EvidenceItem, AutonomyLevel, RiskLevel } from "../shared/types";

type View = "landing" | "control" | "demo" | "architecture" | "history";
type ApiState = { session: SessionState; scenarios: DemoScenario[] };

let sessionId = window.localStorage.getItem("vouch-session") ?? "";
const api = async (url: string, options?: RequestInit): Promise<any> => {
  const response = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...(sessionId ? { "x-vouch-session": sessionId } : {}), ...(options?.headers || {}) } });
  const nextSessionId = response.headers.get("x-vouch-session");
  if (nextSessionId) {
    sessionId = nextSessionId;
    window.localStorage.setItem("vouch-session", nextSessionId);
  }
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
};

function App() {
  const [view, setView] = useState<View>("landing");
  const [data, setData] = useState<ApiState | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [mobileNav, setMobileNav] = useState(false);

  const load = useCallback(async () => {
    try { setData(await api("/api/session")); } catch { setToast("Agent service unavailable · demo mode remains available."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(""), 5000); return () => clearTimeout(timer); }, [toast]);

  const navigate = (next: View) => { setView(next); setMobileNav(false); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const runScenario = async (id: string, resolved = false) => {
    setLoading(true);
    try {
      const result = await api(`/api/scenarios/${id}/run`, { method: "POST", body: JSON.stringify({ resolved }) });
      setData((previous) => ({ session: result.session, scenarios: result.scenarios ?? previous?.scenarios ?? [] }));
      setView("control");
    } catch (error) { setToast(error instanceof Error ? error.message : "Action failed"); }
    finally { setLoading(false); }
  };
  const mutateAction = async (path: string) => {
    if (!data?.session.currentAction) return;
    setLoading(true);
    try {
      const result = await api(path, { method: "POST" });
      setData((previous) => ({ session: result.session, scenarios: result.scenarios ?? previous?.scenarios ?? [] }));
      if (result.message) setToast(result.message);
    } catch (error) { setToast(error instanceof Error ? error.message : "Action failed"); }
    finally { setLoading(false); }
  };

  if (loading && !data) return <div className="boot"><img src="/vouch-mascot.svg" /><div><span>VOUCH</span><small>Establishing a trusted session…</small></div></div>;
  return (
    <div className="app-shell">
      <Header view={view} navigate={navigate} mobileNav={mobileNav} setMobileNav={setMobileNav} trust={data?.session.trust} />
      <main>
        {view === "landing" && <Landing navigate={navigate} />}
        {view === "control" && data && <ControlCenter data={data} runScenario={runScenario} mutateAction={mutateAction} setToast={setToast} loading={loading} />}
        {view === "demo" && data && <DemoCenter scenarios={data.scenarios} runScenario={runScenario} loading={loading} />}
        {view === "architecture" && <Architecture />}
        {view === "history" && data && <HistoryView session={data.session} />}
      </main>
      <footer><div className="footer-brand"><img src="/vouch-mark.svg" /> VOUCH</div><span>Trust-based autonomy for AI agents</span><span>Prototype · deterministic demo mode</span></footer>
      {toast && <div className="toast"><ShieldAlert size={17} />{toast}<button onClick={() => setToast("")}><X size={14} /></button></div>}
    </div>
  );
}

function Header({ view, navigate, mobileNav, setMobileNav, trust }: { view: View; navigate: (v: View) => void; mobileNav: boolean; setMobileNav: (v: boolean) => void; trust?: SessionState["trust"] }) {
  return <header className="topbar">
    <button className="brand" onClick={() => navigate("landing")} aria-label="VOUCH home"><img src="/vouch-mark.svg" /><span>VOUCH<small>Trust-based autonomy</small></span></button>
    <button className="mobile-menu" onClick={() => setMobileNav(!mobileNav)} aria-label="Toggle navigation"><Menu size={21} /></button>
    <nav className={mobileNav ? "nav open" : "nav"}>
      <button className={view === "control" ? "active" : ""} onClick={() => navigate("control")}><Gauge size={16} />Control center</button>
      <button className={view === "demo" ? "active" : ""} onClick={() => navigate("demo")}><Play size={16} />Demo center</button>
      <button className={view === "architecture" ? "active" : ""} onClick={() => navigate("architecture")}><Command size={16} />Architecture</button>
      <button className={view === "history" ? "active" : ""} onClick={() => navigate("history")}><History size={16} />Action history</button>
    </nav>
    <div className="agent-status"><i className="pulse" /><span>AGENT ONLINE</span><b>TRUST {trust?.score ?? 87}</b><strong>{trust?.autonomy ?? "T3"} {trust?.autonomy === "T3" ? "AUTONOMOUS" : ""}</strong></div>
  </header>;
}

function Landing({ navigate }: { navigate: (v: View) => void }) {
  return <div className="landing">
    <section className="landing-hero content-width">
      <div className="hero-copy">
        <div className="eyebrow"><span className="eyebrow-line" />THE CONTROL LAYER FOR AGENTS</div>
        <h1>AI can act.<br /><em>VOUCH makes it<br />earn the right.</em></h1>
        <p className="hero-lead">A trust-based agentic control system that evaluates evidence, risk, authority, and outcomes before granting AI agents autonomy.</p>
        <div className="hero-actions"><button className="button primary" onClick={() => navigate("demo")}><Play size={16} />Run the demo <ArrowRight size={16} /></button><button className="button ghost" onClick={() => navigate("architecture")}>See the architecture <ChevronRight size={16} /></button></div>
        <div className="hero-proof"><span><ShieldCheck size={16} /> Deny by default</span><span><FileCheck2 size={16} /> Verify every outcome</span><span><Fingerprint size={16} /> Authority is earned</span></div>
      </div>
      <HeroVisual />
    </section>
    <section className="marquee"><div>REQUEST <span>→</span> EVIDENCE <span>→</span> RISK <span>→</span> AUTHORITY <span>→</span> ACTION <span>→</span> VERIFY <span>→</span> TRUST</div></section>
    <section className="why content-width">
      <div className="section-kicker">WHY VOUCH</div><h2>Capability is not trust.</h2><p className="section-intro">Agents are becoming capable of taking real actions. The challenge is no longer only whether an agent can act, but whether it should.</p>
      <div className="principles"><Principle number="01" title="EARN" text="Autonomy increases through verified reliability, not ambition." icon={<Sparkles />} /><Principle number="02" title="DECIDE" text="Every action is evaluated against evidence, risk, and authority." icon={<ScanSearch />} /><Principle number="03" title="VERIFY" text="Every action is checked after execution. Success is proven, not assumed." icon={<BadgeCheck />} /></div>
    </section>
    <section className="landing-bottom content-width"><div><div className="section-kicker">THE VOUCH PROMISE</div><h2>When something doesn’t look right,<br /><span>the agent stops.</span></h2></div><button className="text-link" onClick={() => navigate("control")}>Open control center <ArrowRight size={17} /></button></section>
  </div>;
}

function HeroVisual() {
  return <div className="hero-visual">
    <div className="hero-orbit orbit-a" /><div className="hero-orbit orbit-b" />
    <div className="guardian-card"><div className="guardian-halo"><img src="/vouch-mascot.svg" /></div><span className="guardian-label">VOUCH GUARDIAN</span><b>Authority is<br />a privilege.</b><div className="guardian-scan"><i />monitoring agent actions <span>LIVE</span></div></div>
    <div className="trust-float"><div className="mini-label">CURRENT TRUST</div><div className="float-score">87<span>/100</span></div><div className="float-track"><i /></div><div className="float-row"><span>T3 · AUTONOMOUS</span><b>+1.2%</b></div></div>
    <div className="hero-grid" />
  </div>;
}

function Principle({ number, title, text, icon }: { number: string; title: string; text: string; icon: React.ReactNode }) {
  return <article className="principle"><div className="principle-head"><span>{number}</span><div className="principle-icon">{icon}</div></div><h3>{title}</h3><p>{text}</p><div className="principle-rule" /></article>;
}

function ControlCenter({ data, runScenario, mutateAction, setToast, loading }: { data: ApiState; runScenario: (id: string, resolved?: boolean) => Promise<void>; mutateAction: (path: string) => Promise<void>; setToast: (s: string) => void; loading: boolean }) {
  const { session, scenarios } = data;
  const current = session.currentAction;
  const scenario = scenarios.find((item) => item.id === session.activeScenarioId) ?? scenarios[1];
  const blocked = current?.state === "BLOCKED";
  const approval = current?.state === "APPROVAL_REQUIRED";
  const verified = current?.verification?.status === "PASS";
  const failed = current?.verification?.status === "FAIL";
  const run = () => runScenario(scenario.id, scenario.id === "conflicting-refund" && session.activity.includes("Human resolution received"));
  return <div className="control content-width">
    <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" />OPERATIONS / LIVE SESSION</div><h1>Control center</h1><p>Evidence in. Authority earned. Outcomes verified.</p></div><div className="mode-chip"><i /><span><b>DEMO MODE</b><small>Deterministic tools active</small></span></div></div>
    <section className="state-strip"><TrustPanel trust={session.trust} /><div className="state-divider" /><div className="state-meta"><span className="mini-label">CURRENT POSTURE</span><b>{session.trust.autonomy} · {session.trust.autonomy === "T3" ? "AUTONOMOUS" : session.trust.autonomy === "T2" ? "ASSISTED" : "SUPERVISED"}</b><p>{session.trust.autonomy === "T3" ? "Low-risk and verified medium-risk actions may execute autonomously." : "Authority has been reduced after a verification failure."}</p><div className="level-dots"><i className={session.trust.autonomy === "T1" ? "on" : ""}>T1</i><i className={session.trust.autonomy === "T2" ? "on" : ""}>T2</i><i className={session.trust.autonomy === "T3" ? "on" : ""}>T3</i><i className={session.trust.autonomy === "T4" ? "on" : ""}>T4</i></div></div><div className="state-meta state-meta-right"><span className="mini-label">SESSION HEALTH</span><div className="health-value"><i className="pulse" />Nominal</div><p>Policy engine is evaluating every consequential action.</p><div className="health-counters"><span><b>{session.audit.length + 12}</b> audit events</span><span><b>{session.trust.verifiedActions}</b> verified actions</span></div></div></section>
    <Workflow state={current?.state} />
    <div className="dashboard-grid">
      <DecisionCard current={current} scenario={scenario} blocked={blocked} approval={approval} verified={verified} failed={failed} run={run} resolve={() => current && mutateAction(`/api/actions/${current.action.id}/resolve`)} mutateAction={mutateAction} loading={loading} />
      <ActivityPanel session={session} />
    </div>
    <div className="lower-grid"><EvidencePanel evidence={session.evidence.length ? session.evidence : scenario.evidence} /><TrustHistory trust={session.trust} events={session.trustHistory} /></div>
  </div>;
}

function TrustPanel({ trust }: { trust: SessionState["trust"] }) {
  const circumference = 2 * Math.PI * 45;
  return <div className="trust-panel"><div className="ring"><svg viewBox="0 0 110 110"><circle className="ring-bg" cx="55" cy="55" r="45" /><circle className="ring-value" cx="55" cy="55" r="45" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - trust.score / 100)} /></svg><div><b>{trust.score}</b><small>/100</small></div></div><div><span className="mini-label">AGENT TRUST</span><b className="trust-title">Demonstrated reliability</b><p>Trust is earned slowly.<br />Demotion is immediate.</p></div></div>;
}

function Workflow({ state }: { state?: string }) {
  const steps = ["REQUEST", "INVESTIGATE", "EVIDENCE", "RISK", "AUTHORITY", "ACTION", "VERIFY"];
  const active = state === "BLOCKED" ? 4 : state === "APPROVAL_REQUIRED" ? 4 : state === "EXECUTING" ? 5 : state === "VERIFYING" ? 6 : state === "VERIFIED" || state === "TRUST_UPDATED" ? 6 : state ? 3 : 0;
  return <section className="workflow"><div className="section-label"><span>LIVE WORKFLOW</span><span className="live-label"><i className="pulse" />{state ? state.replaceAll("_", " ") : "AWAITING REQUEST"}</span></div><div className="workflow-track">{steps.map((step, index) => <div className={`workflow-step ${index < active ? "done" : ""} ${index === active ? "active" : ""} ${state === "BLOCKED" && index === active ? "blocked" : ""}`} key={step}><div className="step-dot">{index < active ? <Check size={13} /> : index + 1}</div><span>{step}</span>{index < steps.length - 1 && <div className="step-line" />}</div>)}</div></section>;
}

function DecisionCard({ current, scenario, blocked, approval, verified, failed, run, resolve, mutateAction, loading }: { current?: ActionRecord; scenario: DemoScenario; blocked: boolean; approval: boolean; verified: boolean; failed: boolean; run: () => void; resolve: () => void; mutateAction: (path: string) => Promise<void>; loading: boolean }) {
  const decision = current?.decision;
  const status = blocked ? "BLOCKED" : approval ? "APPROVAL REQUIRED" : verified ? "VERIFIED" : failed ? "VERIFICATION FAILED" : current?.state === "TRUST_UPDATED" ? "AUTHORIZED" : "READY TO EVALUATE";
  const tone = blocked || failed ? "danger" : approval ? "warning" : verified ? "success" : "neutral";
  return <section className={`decision-card ${tone}`}>
    <div className="card-topline"><span className="section-label">ACTION DECISION</span><span className="decision-id">VOUCH / {current?.action.id ?? "NO ACTIVE ACTION"}</span></div>
    <div className="decision-status"><div className="status-icon">{blocked ? <Ban /> : approval ? <LockKeyhole /> : verified ? <Check /> : failed ? <ShieldAlert /> : <Radio />}</div><div><span className="mini-label">DECISION STATUS</span><h2>{status}</h2></div><span className={`risk-badge ${scenario.action.risk.toLowerCase()}`}>{scenario.action.risk} RISK</span></div>
    <div className="action-request"><span className="mini-label">PROPOSED ACTION</span><h3>{scenario.action.title}</h3><p>{scenario.action.detail}</p></div>
    <div className="decision-metrics"><Metric label="EVIDENCE" value={`${current?.decision ? scenario.evidence.length : 0} sources`} /><Metric label="CONFIDENCE" value={decision ? `${decision.confidence}%` : "—"} /><Metric label="REVERSIBILITY" value={scenario.action.reversibility.replace("_", " ")} /><Metric label="AUTHORITY" value={decision?.authority?.split(" · ")[0] ?? "Pending"} /></div>
    <div className={`decision-reason ${tone}`}><span className="mini-label">{blocked ? "WHY VOUCH STOPPED THE AGENT" : approval ? "WHY APPROVAL IS REQUIRED" : failed ? "VERIFICATION RESULT" : verified ? "POST-ACTION VERIFICATION" : "SYSTEM POSITION"}</span><p>{current?.verification?.message ?? decision?.reason ?? "Select a deterministic scenario from the Demo Center to begin."}</p>{blocked && <div className="stop-callout"><ShieldAlert size={15} /> {scenario.hasInjection ? "Untrusted instruction detected. Instruction is data, not authority." : "Authoritative policy and secondary communication disagree."}</div>}</div>
    <div className="decision-actions">{blocked && scenario.hasConflict && <button className="button primary" onClick={resolve}><RefreshCw size={15} />Resolve conflict</button>}{blocked && scenario.hasConflict && <button className="button ghost" onClick={run}>Re-run action</button>}{approval && <><button className="button primary" disabled={loading} onClick={() => current && mutateAction(`/api/actions/${current.action.id}/approve`)}><Check size={15} />Approve</button><button className="button ghost danger-text" disabled={loading} onClick={() => current && mutateAction(`/api/actions/${current.action.id}/reject`)}><X size={15} />Reject</button></>}{(!current || verified || failed) && <button className="button primary" onClick={run} disabled={loading}><Play size={15} />{loading ? "Evaluating…" : "Run scenario"}</button>}<span className="decision-footnote"><LockKeyhole size={13} /> Enforced server-side</span></div>
  </section>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div><span className="mini-label">{label}</span><b>{value}</b></div>; }

function ActivityPanel({ session }: { session: SessionState }) {
  return <section className="activity-panel"><div className="panel-heading"><div><span className="section-label">AGENT ACTIVITY</span><p>Operational record · live session</p></div><span className="live-pill"><i className="pulse" />LIVE</span></div><div className="activity-list">{session.activity.map((item, index) => <div className={`activity-item ${index === 0 ? "latest" : ""}`} key={`${item}-${index}`}><span className="activity-dot">{index === 0 ? <i className="pulse" /> : <Check size={11} />}</span><span>{item}</span><time>{index === 0 ? "now" : `${index * 2 + 1}s ago`}</time></div>)}</div><div className="agent-note"><img src="/vouch-mascot.svg" /><div><span className="mini-label">GUARDIAN NOTE</span><p>“The safest action is the one the evidence can support.”</p></div></div></section>;
}

function EvidencePanel({ evidence }: { evidence: EvidenceItem[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  return <section className="evidence-panel"><div className="panel-heading"><div><span className="section-label">EVIDENCE LEDGER</span><p>Structured sources · authority weighted</p></div><span className="source-count">{evidence.length} SOURCES</span></div><div className="evidence-list">{evidence.map((item) => <button className={`evidence-item ${item.authority.toLowerCase()}`} onClick={() => setExpanded(expanded === item.id ? null : item.id)} key={item.id}><div className="evidence-icon">{item.authority === "UNTRUSTED" ? <ShieldAlert size={16} /> : item.authority === "AUTHORITATIVE" ? <LockKeyhole size={16} /> : <FileCheck2 size={16} />}</div><div className="evidence-main"><div className="evidence-title"><b>{item.source}</b><span className={`authority ${item.authority.toLowerCase()}`}>{item.authority}</span></div><p>{item.finding}</p>{expanded === item.id && <div className="evidence-detail"><span>{item.content}</span><small>{item.sourceType} · {item.confidence}% confidence · {item.verification}</small></div>}</div><ChevronDown className={expanded === item.id ? "rotate" : ""} size={16} /></button>)}</div></section>;
}

function TrustHistory({ trust, events }: { trust: SessionState["trust"]; events: SessionState["trustHistory"] }) {
  const items = events.length ? events : [{ id: "seed", timestamp: new Date().toISOString(), from: 86, to: 87, reason: "Successful verified action", autonomyFrom: "T3" as AutonomyLevel, autonomyTo: "T3" as AutonomyLevel }];
  return <section className="trust-history"><div className="panel-heading"><div><span className="section-label">TRUST HISTORY</span><p>Reliability compounds over time</p></div><button className="icon-button" aria-label="Trust explanation"><CircleHelp size={16} /></button></div><div className="trust-timeline">{items.slice(0, 4).map((event) => <div className="trust-event" key={event.id}><div className={`trust-event-dot ${event.to < event.from ? "down" : "up"}`} /> <div><div className="trust-change"><b>{event.from}</b><ArrowRight size={13} /><b className={event.to < event.from ? "down-text" : ""}>{event.to}</b><span>{event.to < event.from ? "DECREASE" : "INCREASE"}</span></div><p>{event.reason}</p><small>{event.autonomyFrom} → {event.autonomyTo}</small></div></div>)}</div><div className="trust-footer"><span><span className="mini-label">RELIABILITY</span><b>{trust.reliability}%</b></span><span><span className="mini-label">SUCCESSFUL</span><b>{trust.verifiedActions}</b></span><span><span className="mini-label">FAILURES</span><b>{trust.verificationFailures}</b></span></div></section>;
}

function DemoCenter({ scenarios, runScenario, loading }: { scenarios: DemoScenario[]; runScenario: (id: string) => Promise<void>; loading: boolean }) {
  return <div className="demo content-width"><div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" />DETERMINISTIC SCENARIO LAB</div><h1>Make the right call.</h1><p>Six ways to watch VOUCH reason about authority before it acts.</p></div><div className="demo-key"><span><i className="dot green" />Executes</span><span><i className="dot amber" />Requests approval</span><span><i className="dot red" />Stops</span></div></div><div className="demo-callout"><div className="callout-icon"><Play size={18} /></div><div><b>The 60-second story</b><p>Start with a safe action. Then run the conflict scenario and watch VOUCH stop the agent. Resolve the evidence, run it again, and trigger verification failure to see authority reduce.</p></div><span className="callout-shortcut"><Command size={13} /> Presenter-ready</span></div><div className="scenario-grid">{scenarios.map((scenario, index) => <button className={`scenario-card ${scenario.accent}`} key={scenario.id} onClick={() => runScenario(scenario.id)} disabled={loading}><div className="scenario-number">0{index + 1}</div><div className="scenario-icon">{scenario.accent === "green" ? <ShieldCheck /> : scenario.accent === "amber" ? <LockKeyhole /> : scenario.accent === "purple" ? <ShieldAlert /> : <Ban />}</div><span className="scenario-tag">{scenario.action.risk} · {scenario.action.reversibility.replace("_", " ")}</span><h2>{scenario.name}</h2><p>{scenario.description}</p><span className="scenario-cta">Run scenario <ArrowRight size={15} /></span></button>)}</div></div>;
}

function Architecture() {
  const nodes = [["USER REQUEST", "Intent enters the trust boundary."], ["STRANDS AGENT", "Recommends and orchestrates tools."], ["TOOLS", "Evidence, risk, policy, action."], ["EVIDENCE LAYER", "Authority and conflict detection."], ["RISK ENGINE", "Impact and reversibility."], ["AUTHORITY ENGINE", "Deterministic allow / ask / block."], ["ACTION", "Only after authorization."], ["VERIFICATION", "Expected state vs actual state."], ["TRUST ENGINE", "Slow promotion. Immediate demotion."], ["AUDIT / OBSERVABILITY", "Append-only operational record."]]; 
  return <div className="architecture content-width"><div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" />HOW IT WORKS</div><h1>The agent recommends.<br /><em>VOUCH decides.</em></h1><p>One clear boundary separates model capability from operational authority.</p></div><div className="architecture-note"><LockKeyhole size={17} /><span><b>Policy-controlled</b><small>Model output never grants its own permission.</small></span></div></div><div className="arch-diagram">{nodes.map(([title, text], index) => <div className={`arch-node ${title === "AUTHORITY ENGINE" ? "key-node" : ""}`} key={title}><span className="arch-index">{String(index + 1).padStart(2, "0")}</span><div><b>{title}</b><p>{text}</p></div>{index < nodes.length - 1 && <ArrowDown />}</div>)}</div><div className="arch-bottom"><div><span className="section-kicker">THE BOUNDARY</span><h2>LLM proposes.<br />Policy disposes.</h2></div><p>VOUCH treats evidence as structured data, ranks its authority, calculates action risk, and uses the current trust score to determine whether the system may act autonomously. After action, verification updates the trust state.</p></div></div>;
}

function ArrowDown() { return <span className="arch-arrow"><ArrowRight size={15} /></span>; }

function HistoryView({ session }: { session: SessionState }) {
  return <div className="history-page content-width"><div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" />AUDIT / OBSERVABILITY</div><h1>Action history</h1><p>An operational record of what VOUCH saw, decided, and verified.</p></div><div className="history-summary"><b>{session.audit.length}</b><span>events recorded</span></div></div><div className="audit-table"><div className="audit-head"><span>EVENT</span><span>ACTION</span><span>STATUS</span><span>RISK</span><span>TIME</span></div>{session.audit.length ? session.audit.map((event) => <div className="audit-row" key={event.id}><div><span className="audit-icon"><Check size={14} /></span><b>{event.type.replaceAll("_", " ")}</b><small>{event.actor} · {event.result}</small></div><span className="mono">{event.actionId.replace("act-", "")}</span><span className={`audit-status ${event.status.toLowerCase()}`}>{event.status}</span><span className={`risk-badge ${event.risk.toLowerCase()}`}>{event.risk}</span><time>{new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></div>) : <div className="empty-history"><History size={22} /><b>No audit events yet</b><span>Run a scenario to create the first operational record.</span></div>}</div></div>;
}

export default App;