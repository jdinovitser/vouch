import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  Activity, ArrowDown, ArrowRight, BadgeCheck, Ban, BookOpen, Check, ChevronDown, ChevronRight, Cloud,
  CircleHelp, FileCheck2, Fingerprint, Gauge, History, Layers3, LockKeyhole,
  Menu, Play, Radio, RefreshCw, ScanSearch, ShieldAlert, ShieldCheck, Sparkles, Users,
  X, Zap,
} from "lucide-react";
import type { ActionRecord, AgentTrust, AutonomyLevel, AuthorizationDecision, DemoScenario, EvidenceItem, SessionState } from "../shared/types";
import { KnightArtwork, KnightAuthority, knightLabels, type KnightState } from "./Knight";

type View = "landing" | "why" | "how" | "demo" | "judges" | "architecture" | "control" | "history";
type ApiState = { session: SessionState; scenarios: DemoScenario[] };
const routeToView: Record<string, View> = {
  "/": "landing", "/why-vouch": "why", "/how-it-works": "how", "/demo": "demo",
  "/judges": "judges", "/architecture": "architecture", "/control": "control", "/history": "history",
};
const viewToRoute: Record<View, string> = Object.fromEntries(Object.entries(routeToView).map(([route, view]) => [view, route])) as Record<View, string>;
const titleByView: Record<View, string> = {
  landing: "VOUCH — Adaptive Authority for AI Agents", why: "VOUCH — Why VOUCH", how: "VOUCH — How It Works",
  demo: "VOUCH — Experience the Demo", judges: "VOUCH — Judge the Agent", architecture: "VOUCH — Architecture",
  control: "VOUCH — Control Center", history: "VOUCH — Action History",
};

let sessionId = window.localStorage.getItem("vouch-session") ?? "";
const api = async (url: string, options?: RequestInit): Promise<any> => {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(sessionId ? { "x-vouch-session": sessionId } : {}), ...(options?.headers || {}) },
  });
  const nextSessionId = response.headers.get("x-vouch-session");
  if (nextSessionId) { sessionId = nextSessionId; window.localStorage.setItem("vouch-session", nextSessionId); }
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
};

function App() {
  const [view, setView] = useState<View>(routeToView[window.location.pathname] ?? "landing");
  const [data, setData] = useState<ApiState | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const load = useCallback(async () => {
    try { setData(await api("/api/session")); } catch { setToast("Agent service unavailable · demo mode remains available."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const onPop = () => setView(routeToView[window.location.pathname] ?? "landing");
    window.addEventListener("popstate", onPop); return () => window.removeEventListener("popstate", onPop);
  }, []);
  useEffect(() => {
    if (!window.location.hash) return;
    requestAnimationFrame(() => document.querySelector(window.location.hash)?.scrollIntoView());
  }, [view, data]);
  useEffect(() => { document.title = titleByView[view]; }, [view]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(""), 5000); return () => clearTimeout(timer); }, [toast]);

  const navigate = (next: View) => {
    const route = viewToRoute[next]; if (window.location.pathname !== route) window.history.pushState({}, "", route);
    setView(next); setMobileNav(false); window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const runScenario = async (id: string, stayOnDemo = false) => {
    setLoading(true);
    try {
      const result = await api(`/api/scenarios/${id}/run`, { method: "POST" });
      setData((previous) => ({ session: result.session, scenarios: result.scenarios ?? previous?.scenarios ?? [] }));
      if (!stayOnDemo) navigate("control");
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
  const resetSession = async () => {
    setLoading(true);
    try {
      const result = await api("/api/session/reset", { method: "POST" });
      setData({ session: result.session, scenarios: result.scenarios });
      setToast("Adaptive authority demonstration reset.");
    } catch (error) { setToast(error instanceof Error ? error.message : "Reset failed"); }
    finally { setLoading(false); }
  };

  if (loading && !data) return <div className="boot"><img src="/vouch-mascot.svg" /><div><span>VOUCH</span><small>Establishing a trusted session…</small></div></div>;
  return <div className="app-shell">
    <Header view={view} navigate={navigate} mobileNav={mobileNav} setMobileNav={setMobileNav} trust={data?.session.trust} />
     <main>
       <EarnedAutonomyStrip view={view} />
       {view === "landing" && <Landing navigate={navigate} trust={data?.session.trust} />}
      {view === "why" && <WhyVouch navigate={navigate} />}
      {view === "how" && <HowItWorks navigate={navigate} />}
       {view === "demo" && data && <DemoExperience session={data.session} scenarios={data.scenarios} runScenario={runScenario} resetSession={resetSession} loading={loading} navigate={navigate} />}
       {view === "judges" && data && <JudgesPage session={data.session} scenarios={data.scenarios} runScenario={runScenario} resetSession={resetSession} loading={loading} navigate={navigate} />}
      {view === "architecture" && <Architecture navigate={navigate} />}
      {view === "control" && data && <ControlCenter data={data} runScenario={runScenario} mutateAction={mutateAction} setToast={setToast} loading={loading} navigate={navigate} />}
      {view === "history" && data && <HistoryView session={data.session} navigate={navigate} />}
    </main>
    <Footer navigate={navigate} />
    {toast && <div className="toast"><ShieldAlert size={17} />{toast}<button onClick={() => setToast("")}><X size={14} /></button></div>}
  </div>;
}

function EarnedAutonomyStrip({ view }: { view: View }) {
  const copy = view === "judges"
    ? "Watch the same agent earn authority, lose it after a failed outcome, then earn it back."
    : view === "demo"
      ? "The signature proof: PROVE → EARN → ACT → VERIFY → ADJUST."
      : view === "control"
        ? "What has this agent earned the authority to do right now?"
        : view === "history"
          ? "Read every transition as evidence → outcome → authority. This is the agent's operational memory."
          : view === "architecture"
            ? "History informs authority. Policy bounds it. Every request is evaluated again."
      : "VOUCH determines what an agent has earned the authority to do—right now.";
  return <div className="earned-banner"><span className="section-kicker">VOUCH / ADAPTIVE AUTHORITY ENGINE</span><h2>{copy} <em>Earned authority is bounded, revocable capability—not permanent permission.</em></h2></div>;
}

function Header({ view, navigate, mobileNav, setMobileNav, trust }: { view: View; navigate: (v: View) => void; mobileNav: boolean; setMobileNav: (v: boolean) => void; trust?: AgentTrust }) {
  const publicView = ["landing", "why", "how", "demo", "architecture", "judges"].includes(view);
  return <header className={`topbar ${publicView ? "public-nav" : "app-nav"}`}>
    <button className="brand" onClick={() => navigate("landing")} aria-label="VOUCH home"><img src="/vouch-mark.svg" /><span>VOUCH<small>Trust-based autonomy</small></span></button>
    <button className="mobile-menu" onClick={() => setMobileNav(!mobileNav)} aria-label="Toggle navigation"><Menu size={21} /></button>
    <nav className={mobileNav ? "nav open" : "nav"}>
      <button className={view === "landing" ? "active" : ""} onClick={() => navigate("landing")}>Product</button>
      <button className={view === "why" ? "active" : ""} onClick={() => navigate("why")}>Why VOUCH</button>
      <button className={view === "how" ? "active" : ""} onClick={() => navigate("how")}>How it works</button>
      <button className={view === "demo" ? "active" : ""} onClick={() => navigate("demo")}><Play size={14} />Demo</button>
      <button className={view === "architecture" ? "active" : ""} onClick={() => navigate("architecture")}>Architecture</button>
      {!publicView && <><button className={view === "control" ? "active" : ""} onClick={() => navigate("control")}><Gauge size={14} />Control center</button><button className={view === "history" ? "active" : ""} onClick={() => navigate("history")}><History size={14} />History</button></>}
    </nav>
    {publicView ? <button className="nav-cta" onClick={() => navigate("control")}>Experience VOUCH <ArrowRight size={14} /></button> : <div className="agent-status"><i className="pulse" /><span>AGENT ONLINE</span><b>TRUST {trust?.score ?? 84}</b><strong>{trust?.autonomy ?? "T2"} · {autonomyName(trust?.autonomy ?? "T2")}</strong></div>}
  </header>;
}

function autonomyName(level: AutonomyLevel) {
  return level === "T1" ? "OBSERVE" : level === "T2" ? "RECOMMEND" : level === "T3" ? "ACT" : "DELEGATE";
}

function Footer({ navigate }: { navigate: (v: View) => void }) {
  return <footer><div className="footer-brand"><img src="/vouch-mark.svg" /> VOUCH</div><div className="footer-links"><button onClick={() => navigate("why")}>Why VOUCH</button><button onClick={() => navigate("how")}>How it works</button><button onClick={() => navigate("demo")}>Demo</button><button onClick={() => navigate("judges")}>For judges</button></div><span>Adaptive authority for AI agents</span></footer>;
}

function Landing({ navigate, trust }: { navigate: (v: View) => void; trust?: AgentTrust }) {
  return <div className="landing">
    <section className="landing-hero content-width">
      <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line" />ADAPTIVE AUTHORITY INFRASTRUCTURE</div><h1>AI agents don't need<br /><em>unlimited autonomy.</em><br />They need earned authority.</h1><p className="hero-lead">VOUCH turns an agent's verified track record into bounded, revocable authority. Trust informs the decision. Policy and current context still decide what happens next.</p><div className="earned-loop"><b>PROVE</b><i /><b>EARN</b><i /><b>ACT</b><i /><b>VERIFY</b><i /><b>ADJUST</b></div><div className="hero-actions"><button className="button primary" onClick={() => navigate("control")}><Zap size={16} />See current authority <ArrowRight size={16} /></button><button className="button ghost" onClick={() => navigate("demo")}>Watch authority change <ChevronRight size={16} /></button></div><div className="hero-proof"><span><ShieldCheck size={16} /> Authority is bounded</span><span><FileCheck2 size={16} /> Outcomes are verified</span><span><Fingerprint size={16} /> Every request is reevaluated</span></div></div>
      <HeroVisual level={trust?.autonomy ?? "T2"} />
    </section>
    <section className="roi-ribbon"><div className="content-width"><span className="ribbon-kicker">THE DIFFERENCE</span><div className="ribbon-message"><b>Static permissions say “may.”</b><b>VOUCH asks “has earned?”</b><b>Authority can return—or be taken away.</b></div><button onClick={() => navigate("why")}>See the distinction <ArrowRight size={15} /></button></div></section>
    <section className="why content-width"><div className="section-kicker">THE QUESTION HAS CHANGED</div><h2>Don’t ask if the AI can do it.<br /><em>Ask if it has earned the authority.</em></h2><p className="section-intro">VOUCH continuously evaluates evidence, risk, authority, and outcomes before allowing an agent to take consequential action.</p><div className="principles"><Principle number="01" title="MOVE FASTER" text="Let agents autonomously handle routine, low-risk work." icon={<Zap />} /><Principle number="02" title="CONTROL RISK" text="Prevent unsupported or unauthorized actions before they happen." icon={<ShieldCheck />} /><Principle number="03" title="SCALE TRUST" text="Increase autonomy as agents demonstrate reliable behavior." icon={<Sparkles />} /></div></section>
     <section className="trust-manifesto content-width"><div><span className="section-kicker">THE VOUCH PROMISE</span><h2>The goal isn’t maximum autonomy.<br /><span>It’s the right authority, right now.</span></h2><p>Authority is earned through evidence, constrained by policy, and revoked when behavior proves unreliable.</p></div><button className="text-link" onClick={() => navigate("demo")}>Watch the same agent change authority <ArrowRight size={17} /></button></section>
  </div>;
}

function HeroVisual({ level }: { level: AutonomyLevel }) {
  const statusCopy = level === "T4" ? "Delegated within defined boundaries." : level === "T3" ? "Ready to act within earned boundaries." : level === "T2" ? "Learning through verified outcomes." : "Observe and recommend; do not act.";
  return <div className="hero-visual"><div className="hero-orbit orbit-a" /><div className="hero-orbit orbit-b" /><div className="hero-grid" /><div className="guardian-card authority-card"><div className="guardian-halo"><KnightAuthority level={level} size="normal" /></div><span className="guardian-label">CURRENT AUTHORITY CREDENTIAL</span><b>{statusCopy}</b><div className="guardian-scan"><i />authority state <span>{level} · {autonomyName(level)}</span></div></div><div className="trust-float"><div className="mini-label">CURRENT AUTHORITY</div><div className="float-score">{level}<span> · {autonomyName(level)}</span></div><div className="float-track"><i style={{ width: `${level === "T1" ? 25 : level === "T2" ? 50 : level === "T3" ? 75 : 100}%` }} /></div><div className="float-row"><span>SERVER-DERIVED</span><b>BOUNDED</b></div></div></div>;
}

function Guardian({ state = "default", size = "normal", celebrating = false }: { state?: KnightState; size?: "normal" | "small"; celebrating?: boolean }) {
  return <div className={`guardian guardian-${state} guardian-${size} ${celebrating ? "guardian-celebrating" : ""}`}><div className="guardian-art">{state === "default" ? <img className="canonical-knight" src="/vouch-mascot.svg" alt="VOUCH Knight ready" /> : <KnightArtwork state={state} />}<span className="wink-eye" aria-hidden="true" /></div><span className="guardian-state">{knightLabels[state]}</span></div>;
}

function Principle({ number, title, text, icon }: { number: string; title: string; text: string; icon: ReactNode }) {
  return <article className="principle"><div className="principle-head"><span>{number}</span><div className="principle-icon">{icon}</div></div><h3>{title}</h3><p>{text}</p><div className="principle-rule" /></article>;
}

function WhyVouch({ navigate }: { navigate: (v: View) => void }) {
  return <div className="story-page why-page content-width"><StoryHero kicker="WHY VOUCH" title={<>Permissions say what an agent can do.<br /><em>VOUCH decides what it has earned.</em></>} text="Static credentials cannot account for whether the last action worked—or whether this request is still within policy. VOUCH evaluates both, every time." mascot="blocked" cta="Watch authority adjust" onClick={() => navigate("demo")} /><section className="story-section"><div className="section-kicker">THE AUTHORITY DILEMMA</div><h2>Static permission is blind.<br />Unlimited autonomy is brittle.</h2><p className="story-lead">An agent that can modify records, approve transactions, trigger workflows, or change system state is an operational actor. Its authority must adapt without becoming a permanent whitelist.</p><div className="option-grid"><Option title="NO AUTHORITY" tag="Safe, but slow." text="Every action requires a human. Humans become the bottleneck and automation becomes glorified assistance." tone="muted" /><Option title="STATIC PERMISSION" tag="Fast, but blind." text="The credential stays the same after a bad outcome. Past approval becomes permanent access." tone="danger" /><Option title="ADAPTIVE AUTHORITY" tag="Earned and bounded." text="History informs authority. Current evidence, risk, policy, context, and hard limits still bound every decision." tone="success" /></div></section><section className="value-section"><div><div className="section-kicker">WHAT VOUCH CHANGES</div><h2>History changes authority.<br /><em>Authority never eliminates evaluation.</em></h2></div><div className="change-list"><Change from="Every consequential action needs a human." to="Humans focus on actions that actually require judgment." /><Change from="Agents receive static permissions." to="Authority adapts to verified reliability and current context." /><Change from="Past approval acts like a whitelist." to="Every request receives a fresh server-side decision." /><Change from="Trust is treated as permission." to="Trust informs authority; policy bounds it." /></div></section><RoiSection /><section className="why-now"><div className="section-kicker">WHY NOW</div><h2>When AI can act,<br /><em>authorization becomes part of the product.</em></h2><div className="automation-ladder"><span>Traditional automation <b>executes a predefined workflow</b></span><ArrowRight /><span>Generative AI <b>produces an answer</b></span><ArrowRight /><span className="current">Agentic AI <b>requires adaptive authority</b></span></div></section><PageCta title="Let reliable agents handle more work." text="Without turning successful history into permanent permission." label="See how it works" onClick={() => navigate("how")} /></div>;
}

function Option({ title, tag, text, tone }: { title: string; tag: string; text: string; tone: string }) {
  return <article className={`option-card ${tone}`}><div className="option-line" /><span className="mini-label">{title}</span><h3>{tag}</h3><p>{text}</p></article>;
}
function Change({ from, to }: { from: string; to: string }) { return <div className="change-row"><div><span>FROM</span><p>{from}</p></div><ArrowRight /><div className="to"><span>TO</span><p>{to}</p></div></div>; }
function RoiSection() {
  const items = [["REDUCE HUMAN REVIEW LOAD", "Routine low-risk actions can proceed autonomously."], ["REDUCE COSTLY MISTAKES", "Unsupported or high-risk actions can be stopped before execution."], ["REDUCE OPERATIONAL DELAYS", "Humans intervene only when their judgment is actually needed."], ["CREATE ACCOUNTABILITY", "Every important action has a decision and verification record."]];
  return <section className="roi-section"><div className="roi-heading"><div className="section-kicker">BUSINESS VALUE</div><h2>The ROI of controlled<br /><em>autonomy.</em></h2><p>VOUCH increases the useful scope of agentic automation without pretending risk does not exist.</p></div><div className="roi-cards">{items.map(([title, text], index) => <div className="roi-card" key={title}><span>0{index + 1}</span><b>{title}</b><p>{text}</p></div>)}</div><div className="attention-visual"><span>HUMAN ATTENTION</span><div><label>BEFORE VOUCH</label><i className="attention-before" /></div><div><label>WITH VOUCH</label><i className="attention-after" /></div><p>Reserve human judgment for decisions that actually need it.</p></div></section>;
}

function HowItWorks({ navigate }: { navigate: (v: View) => void }) {
  const stages = [["01", "REQUEST", "The agent proposes an action."], ["02", "EVIDENCE", "VOUCH evaluates typed, bound evidence."], ["03", "AUTHORITY", "Current standing decides what is permitted."], ["04", "ACTION", "Only authorized actions execute."], ["05", "VERIFY", "Expected outcome meets observed outcome."], ["06", "TRUST", "Verified behavior changes standing."], ["07", "AUTONOMY", "Future authority decisions now adapt."]];
  const stageKnight: Record<string, KnightState> = { REQUEST: "default", EVIDENCE: "investigating", AUTHORITY: "approval", ACTION: "deployment", VERIFY: "verified", TRUST: "verified", AUTONOMY: "verified" };
  return <div className="story-page how-page content-width"><StoryHero kicker="HOW VOUCH WORKS" title={<>Authority adapts.<br /><em>Authorization stays per-request.</em></>} text="Every proposed action receives a fresh server-side decision using verified history, current evidence, risk, policy, context, and hard safety limits." mascot="default" cta="Run the guided demo" onClick={() => navigate("demo")} /><section className="lifecycle"><div className="lifecycle-intro"><div className="section-kicker">THE AUTHORITY LIFECYCLE</div><h2>Every request.<br /><em>A fresh decision.</em></h2><p>The model recommends. VOUCH evaluates the current request. Verification adjusts standing for the next request—it never creates a permanent whitelist.</p></div><div className="lifecycle-list">{stages.map(([number, title, text], index) => <div className={`lifecycle-row ${title === "AUTHORITY" ? "authority-row" : ""}`} key={title}><span>{number}</span><div className="lifecycle-marker">{index < 4 ? <Check size={14} /> : <span />}</div><div><b>{title}</b><p>{text}</p></div><div className="lifecycle-knight"><Guardian state={stageKnight[title]} size="small" /></div>{index < stages.length - 1 && <ArrowDown />}</div>)}</div></section><section className="autonomy-section" id="authority-levels"><div className="section-kicker">BOUNDED AUTHORITY LEVELS</div><h2>Standing expands capability.<br /><em>Policy defines the ceiling.</em></h2><div className="autonomy-steps">{([["T1", "OBSERVE", "Inspect and explain, but do not change external state."], ["T2", "RECOMMEND", "Take bounded low-risk actions; escalate consequential ones."], ["T3", "ACT", "Execute eligible medium-risk actions within current policy."], ["T4", "DELEGATE", "Operate across broader approved scopes; hard limits still apply."]] as const).map(([level, name, text], index) => <div className={`autonomy-step level-${level}`} key={level}><span>{level}</span><KnightAuthority level={level} size="small" state="deployment" /><b>{name}</b><p>{text}</p>{index < 3 && <ArrowRight />}</div>)}</div><p className="autonomy-note"><ShieldAlert size={15} /> High-risk, irreversible, conflicted, or policy-bound actions do not become autonomous merely because standing is high.</p></section><section className="trust-product"><Guardian state="verified" size="small" /><div><div className="section-kicker">THE FEEDBACK LOOP</div><h2>PROVE → EARN → ACT.<br /><em>VERIFY → ADJUST.</em></h2></div><div className="trust-loop"><span>Verified history</span><ArrowRight /><b>Current standing</b><ArrowRight /><span>Fresh authority decision</span><strong>Bounded by</strong><span>Evidence + risk</span><ArrowRight /><b>Policy + context</b><ArrowRight /><span>Hard safety limits</span></div></section><PageCta title="See the decision in motion." text="Watch one agent earn, lose, and conditionally recover bounded authority." label="Run the demo" onClick={() => navigate("demo")} /></div>;
}

function StoryHero({ kicker, title, text, mascot, cta, onClick }: { kicker: string; title: ReactNode; text: string; mascot: KnightState; cta: string; onClick: () => void }) {
  return <section className="story-hero"><div><div className="eyebrow"><span className="eyebrow-line" />{kicker}</div><h1>{title}</h1><p>{text}</p><button className="button primary" onClick={onClick}>{cta}<ArrowRight size={16} /></button></div><div className="story-hero-visual"><div className="hero-orbit orbit-a" /><Guardian state={mascot} /><div className="hero-state-card"><span className="mini-label">VOUCH PRINCIPLE</span><b>{mascot === "investigating" ? "Evidence before authority." : mascot === "blocked" ? "Protection is a successful outcome." : "The agent recommends."}</b><small>Policy decides whether it may act.</small></div></div></section>;
}
function PageCta({ title, text, label, onClick }: { title: string; text: string; label: string; onClick: () => void }) { return <section className="page-cta"><div><h2>{title}</h2><p>{text}</p></div><button className="button primary" onClick={onClick}>{label}<ArrowRight size={16} /></button></section>; }

function DemoExperience({ session, scenarios, runScenario, resetSession, loading, navigate }: { session: SessionState; scenarios: DemoScenario[]; runScenario: (id: string, stayOnDemo?: boolean) => Promise<void>; resetSession: () => Promise<void>; loading: boolean; navigate: (v: View) => void }) {
  const [scenarioId, setScenarioId] = useState("safe-review");
  return <div className="demo-experience content-width">
    <div className="demo-hero-heading"><div><div className="eyebrow"><span className="eyebrow-line" />THE ADAPTIVE AUTHORITY PROOF</div><h1>One agent.<br /><em>Every request reevaluated.</em></h1><p>Watch verified history change available authority without bypassing current evidence, risk, policy, context, or hard safety limits.</p></div><KnightAuthority level={session.trust.autonomy} size="normal" state="deployment" /></div>
    <EarnedLifecycleDemo session={session} scenarios={scenarios} runScenario={runScenario} resetSession={resetSession} loading={loading} />
    <section className="demo-outcome"><div><span className="section-kicker">EXPLORE THE SAFETY BOUNDARY</span><h2>One authority engine.<br /><em>Five honest answers.</em></h2><p>After the lifecycle proof, inspect independent blocked, approval-required, execution, injection-defense, and verification outcomes.</p></div><div className="scenario-rail">{scenarios.filter((scenario) => !scenario.recovery && scenario.id !== "recovered-account-update").map((scenario) => <button className={`scenario-mini ${scenario.accent} ${scenario.id === scenarioId ? "selected" : ""}`} onClick={() => { setScenarioId(scenario.id); void runScenario(scenario.id); }} disabled={loading} key={scenario.id}><span className="mini-label">{scenario.action.risk} RISK</span><b>{scenario.name}</b><small>{scenario.hasConflict ? "VOUCH stops" : scenario.id === "human-refund" ? "Human decides" : scenario.failVerification ? "Trust reduces" : "Agent acts"}</small><ArrowRight size={14} /></button>)}</div></section>
    <PageCta title="Want the technical boundary?" text="The model recommends. The VOUCH authorization layer decides." label="Explore architecture" onClick={() => navigate("architecture")} />
  </div>;
}

function JudgesPage({ session, scenarios, runScenario, resetSession, loading, navigate }: { session: SessionState; scenarios: DemoScenario[]; runScenario: (id: string, stayOnDemo?: boolean) => Promise<void>; resetSession: () => Promise<void>; loading: boolean; navigate: (v: View) => void }) {
  const runtime = session.service.mode === "AWS_LIVE"
    ? [["AWS LIVE · STRANDS AGENTS", "Successful model recommendation"], ["AMAZON BEDROCK", session.service.message]]
    : [["DEMO · DETERMINISTIC EVALUATOR", "No live AWS invocation"], ["STRANDS + BEDROCK PATH", "Activates only after a successful invocation"]];
  return <div className="judges-page content-width"><section className="judges-hero"><div><div className="eyebrow"><span className="eyebrow-line" />THE 90-SECOND PROOF</div><h1>Watch authority<br /><em>adjust—not persist.</em></h1><p>The same Claims Resolution Agent gains bounded authority, loses it when verification fails, and conditionally earns it back. Every request still receives a fresh decision.</p><div className="hero-actions"><button className="button primary" onClick={() => document.getElementById("judges-demo")?.scrollIntoView({ behavior: "smooth" })}><Play size={16} />Start live proof</button><button className="button ghost" onClick={() => navigate("architecture")}>Inspect the boundary <ArrowRight size={16} /></button></div></div><div className="judge-stamp"><KnightAuthority level={session.trust.autonomy} size="normal" state="verified" /><span>WHAT TO WATCH</span><b>History informs authority.<br /><em>Policy still bounds it.</em></b></div></section><section className="judge-takeaways"><div><div className="section-kicker">THE STORY IN 90 SECONDS</div><h2>Not a trust score.<br /><em>A changing authorization result.</em></h2></div><div className="judge-timeline">{[["00:00", "T2 · Recommend"], ["00:15", "Prove + earn T3"], ["00:30", "Fresh decision: execute"], ["00:45", "Verification fails"], ["01:00", "Authority reduced"], ["01:15", "Fresh decision: approval"], ["01:30", "Conditional recovery"]].map(([time, label], index) => <div key={time} className={index === 4 ? "critical" : ""}><time>{time}</time><span /><b>{label}</b></div>)}</div></section><section className="judge-watch"><div className="watch-panel"><div className="section-kicker">WHAT TO NOTICE</div><h2>Look for the<br /><em>changed decision.</em></h2>{["The agent begins at T2 RECOMMEND.", "A verified outcome makes T3 ACT available.", "The model never grants its own authority.", "A failed outcome immediately demotes the agent.", "The same action class now needs human approval.", "Recovery is verified, conditional, and bounded."].map((item) => <p key={item}><Check size={14} />{item}</p>)}</div><div className="impact-panel"><KnightAuthority level={session.trust.autonomy} size="small" state="verified" /><div className="section-kicker">WHY THIS MATTERS</div><h2>Useful autonomy.<br />Visible accountability.<br /><em>No permanent whitelist.</em></h2><p>VOUCH turns verified history into currently available capability while hard policy limits remain in force.</p></div></section><section id="judges-demo"><EarnedLifecycleDemo session={session} scenarios={scenarios} runScenario={runScenario} resetSession={resetSession} loading={loading} /></section><section className="technical-snapshot"><div><div className="section-kicker">TECHNICAL SNAPSHOT</div><h2>Built for the<br /><em>real world.</em></h2></div><div className="tech-grid">{[...runtime, ["AGENT TOOLS", "Evidence inspection · recommendation"], ["VOUCH AUTHORITY ENGINE", "Fresh deterministic decision per request"], ["POLICY BOUNDARIES", "Hard limits override standing"], ["AUDIT LAYER", "Evidence · outcome · authority provenance"]].map(([name, text]) => <div key={name}><Layers3 size={16} /><b>{name}</b><span>{text}</span></div>)}</div></section></div>;
}

function EarnedLifecycleDemo({ session, scenarios, runScenario, resetSession, loading }: { session: SessionState; scenarios: DemoScenario[]; runScenario: (id: string, stayOnDemo?: boolean) => Promise<void>; resetSession: () => Promise<void>; loading: boolean }) {
  const current = session.currentAction;
  const hasEarned = session.history.some((item) => item.action.scenarioId === "safe-review" && item.verification?.status === "PASS");
  const hasFailed = session.history.some((item) => item.action.scenarioId === "verification-failure" && item.verification?.status === "FAIL");
  const hasApprovalProof = current?.action.scenarioId === "verification-failure" && current.state === "APPROVAL_REQUIRED";
  const hasRecovered = session.history.some((item) => item.action.scenarioId === "recovery-sequence" && item.verification?.status === "PASS");
  const hasActedAgain = session.history.some((item) => item.action.scenarioId === "recovered-account-update" && item.verification?.status === "PASS");
  const phase = hasActedAgain ? 5 : hasRecovered ? 4 : hasApprovalProof ? 3 : hasFailed ? 2 : hasEarned ? 1 : 0;
  const stages = ["EARN", "ACT", "LOSE", "REQUIRE REVIEW", "RECOVER", "ACT AGAIN"];
  const headlines = [
    "The agent begins with limited authority.",
    "Verified behavior earned T3 ACT.",
    "Verification failed. Authority contracted.",
    "The same action class now requires approval.",
    "A monitored recovery sequence restored T3.",
    "The agent can act autonomously again.",
  ];
  const descriptions = [
    "At T2 RECOMMEND, the agent may complete bounded low-risk work. A verified outcome can earn broader authority.",
    "At T3 ACT, a verified medium-risk account update is eligible to execute without human approval.",
    "The API returned, but the expected account state did not appear. VOUCH treated the outcome—not the attempt—as truth.",
    "Nothing about the model changed. Its earned standing changed, so policy now returns APPROVAL_REQUIRED.",
    "Three monitored, bounded actions verified successfully. Recovery evidence restored the authority credential.",
    "The same category of account update now executes because the agent earned T3 again.",
  ];
  const actions: ReadonlyArray<readonly [string, string]> = [
    ["Earn T3 with a verified action", "safe-review"],
    ["Exercise T3 and verify the outcome", "verification-failure"],
    ["Retry at reduced authority", "verification-failure"],
    ["Complete monitored recovery", "recovery-sequence"],
    ["Act again with restored authority", "recovered-account-update"],
  ];
  const nextAction = phase < actions.length ? actions[phase] : undefined;
  const scenario = scenarios.find((item) => item.id === current?.action.scenarioId);
  const lastTrustEvent = session.trustHistory[0];
  return <section className="guided-demo judge-live-demo">
    <div className="demo-topline"><div><span className="section-label">LIVE BACKEND PROOF</span><p>{session.service.message}</p></div><span className="demo-clock running"><Radio size={14} /> ACTUAL SESSION STATE</span></div>
    <div className="demo-timeline judge-live-timeline">{stages.map((stage, index) => <button className={`${index < phase ? "complete" : ""} ${index === phase ? "current" : ""} ${index > phase ? "future" : ""}`} disabled key={stage}><span>{index < phase ? <Check size={12} /> : String(index + 1).padStart(2, "0")}</span>{stage}{index < stages.length - 1 && <i />}</button>)}</div>
     <div className="demo-stage-card"><div className="stage-graphic"><div className="stage-ring" /><KnightAuthority level={session.trust.autonomy} size="normal" state="deployment" /><span>{phase === 5 ? "PROOF COMPLETE" : `${session.trust.autonomy} · ${autonomyName(session.trust.autonomy)}`}</span></div><div className="stage-copy"><span className="mini-label">ADAPTIVE AUTHORITY / STEP {phase + 1}</span><h2>{headlines[phase]}</h2><p>{descriptions[phase]}</p>{lastTrustEvent && <div className="transition-callout"><span>OUTCOME</span><ArrowRight size={13} /><b>{lastTrustEvent.from} → {lastTrustEvent.to}</b><ArrowRight size={13} /><span className="outcome-authority">{lastTrustEvent.autonomyFrom} → {lastTrustEvent.autonomyTo}</span></div>}<div className="judge-live-details"><div><span>CURRENT CREDENTIAL</span><b>{session.trust.autonomy} · {autonomyName(session.trust.autonomy)}</b><small>Reliability {session.trust.score}/100 · one decision input</small></div><div><span>VOUCH AUTHORITY</span><b>{current?.decision?.authorization ?? "READY"}</b><small>Fresh deterministic decision</small></div><div><span>CONTROLLED ACTION</span><b>{current?.execution?.status ?? "NOT EXECUTED"}</b><small>No external system mutation</small></div><div><span>VERIFICATION</span><b>{current?.verification?.status ?? "—"}</b><small>{current?.verification ? `${current.verification.expected} / ${current.verification.actual}` : "Expected vs actual"}</small></div><div><span>AGENT RECOMMENDATION</span><b>{current?.agentRecommendation?.recommendation ?? "—"}</b><small>{current?.agentRecommendation?.provider ?? session.service.mode}</small></div><div><span>EVIDENCE PROVENANCE</span><b>{current?.agentRecommendation?.evidenceRefs.length ?? scenario?.evidence.length ?? 0} REFERENCES</b><small>{current?.evidenceVersion ? current.evidenceVersion.slice(0, 12) : "Not evaluated"}</small></div></div></div></div>
    <div className="demo-controls">{nextAction ? <button className="control-button primary-control" onClick={() => void runScenario(nextAction[1], true)} disabled={loading}><Play size={15} />{loading ? "Evaluating…" : nextAction[0]}</button> : <span className="proof-complete"><Check size={15} /> Full earned autonomy lifecycle verified</span>}<button className="control-button" onClick={() => void resetSession()} disabled={loading}><RefreshCw size={15} />Reset proof</button><span className="decision-footnote"><LockKeyhole size={13} /> Driven by API responses and server-held authorization state</span></div>
  </section>;
}

function ControlCenter({ data, runScenario, mutateAction, setToast, loading, navigate }: { data: ApiState; runScenario: (id: string) => Promise<void>; mutateAction: (path: string) => Promise<void>; setToast: (s: string) => void; loading: boolean; navigate: (v: View) => void }) {
  const { session, scenarios } = data; const current = session.currentAction; const scenario = scenarios.find((item) => item.id === session.activeScenarioId) ?? scenarios[1];
  const blocked = current?.state === "BLOCKED"; const approval = current?.state === "APPROVAL_REQUIRED"; const verified = current?.verification?.status === "PASS"; const failed = current?.verification?.status === "FAIL";
  const run = () => runScenario(scenario.id);
   return <div className="control content-width"><div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" />CLAIMS RESOLUTION AGENT / LIVE SESSION</div><h1>What is this agent authorized to do right now?</h1><p>VOUCH combines verified history with the evidence, risk, policy, and context of the current request.</p></div><div className="mode-chip"><i /><span><b>{session.service.mode === "AWS_LIVE" ? "AWS LIVE" : "DEMO MODE"}</b><small>{session.service.message}</small></span></div></div><AuthorityCredential session={session} scenario={scenario} /><section className="state-strip"><TrustPanel trust={session.trust} /><div className="state-divider" /><div className="state-meta"><span className="mini-label">RELIABILITY SIGNAL</span><b>{session.trust.score}/100 · {session.trust.verifiedActions} verified</b><p>This informs authority. It is not permission by itself.</p><div className="level-dots"><i className={session.trust.autonomy === "T1" ? "on" : ""}>T1</i><i className={session.trust.autonomy === "T2" ? "on" : ""}>T2</i><i className={session.trust.autonomy === "T3" ? "on" : ""}>T3</i><i className={session.trust.autonomy === "T4" ? "on" : ""}>T4</i></div></div><div className="state-meta state-meta-right"><span className="mini-label">EVALUATION GUARANTEE</span><div className="health-value"><i className="pulse" />Fresh decision per request</div><p>Past success cannot bypass current policy or hard safety limits.</p><div className="health-counters"><span><b>{session.audit.length}</b> audit events</span><span><b>{session.trust.verificationFailures}</b> failures</span></div></div></section><Workflow state={current?.state} /><div className="dashboard-grid"><DecisionCard current={current} scenario={scenario} authority={session.trust.autonomy} blocked={blocked} approval={approval} verified={verified} failed={failed} run={run} resolve={() => current && mutateAction(`/api/actions/${current.action.id}/resolve`)} mutateAction={mutateAction} loading={loading} /><ActivityPanel session={session} /></div><div className="lower-grid"><EvidencePanel evidence={session.evidence.length ? session.evidence : scenario.evidence} /><TrustHistory trust={session.trust} events={session.trustHistory} /></div><button className="back-to-demo" onClick={() => navigate("demo")}><Play size={14} /> Return to adaptive authority demo</button></div>;
}

function AuthorityCredential({ session, scenario }: { session: SessionState; scenario: DemoScenario }) {
  const { trust, currentAction } = session;
  const expanded = trust.autonomy === "T3" || trust.autonomy === "T4";
  const recent = session.trustHistory[0];
  return <section className="authority-credential-live"><div className="credential-current"><KnightAuthority level={trust.autonomy} size="small" /><span className="mini-label">CURRENT AUTHORITY</span><h2>{trust.autonomy} · {autonomyName(trust.autonomy)}</h2><p>What the Claims Resolution Agent can do right now</p><small>Reliability {trust.score}/100 informs this credential; it does not grant permission alone.</small></div><div className="credential-scope"><span><b>AVAILABLE CAPABILITY</b>{expanded ? "Low-risk and eligible medium-risk actions" : trust.autonomy === "T2" ? "Investigation and low-risk reversible actions" : "Observation and recommendation"}</span><span><b>WHY</b>Verified history + current evidence + {scenario.action.risk.toLowerCase()} risk + policy</span><span><b>BOUNDARIES</b>{expanded ? "High-risk, irreversible, conflicted, or policy-bound actions still require review or stop" : "Medium- and high-risk actions require review; unsafe evidence is blocked"}</span><span><b>RECENT CHANGE</b>{recent ? `${recent.autonomyFrom} → ${recent.autonomyTo} · ${recent.reason}` : "No outcome-driven authority change in this session yet"}</span><span><b>NEXT DECISION</b>{currentAction?.decision ? `${currentAction.action.title}: ${currentAction.decision.authorization}` : `${scenario.action.title}: fresh evaluation required`}</span></div><div className="credential-rule"><ShieldCheck size={15} /><span><b>POLICY SHIELD / ACTIVE</b>History changes authority. Policy still bounds it on every request.</span></div></section>;
}

function TrustPanel({ trust }: { trust: SessionState["trust"] }) { const circumference = 2 * Math.PI * 45; return <div className="trust-panel"><div className="ring"><svg viewBox="0 0 110 110"><circle className="ring-bg" cx="55" cy="55" r="45" /><circle className="ring-value" cx="55" cy="55" r="45" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - trust.score / 100)} /></svg><div><b>{trust.score}</b><small>/100</small></div></div><div><span className="mini-label">AGENT TRUST</span><b className="trust-title">Demonstrated reliability</b><p>Trust is earned slowly.<br />Demotion is immediate.</p></div></div>; }
function Workflow({ state }: { state?: string }) { const steps = ["REQUEST", "INVESTIGATE", "EVIDENCE", "RISK", "AUTHORITY", "ACTION", "VERIFY"]; const active = state === "BLOCKED" || state === "APPROVAL_REQUIRED" ? 4 : state === "EXECUTING" ? 5 : state === "VERIFYING" ? 6 : state === "VERIFIED" || state === "TRUST_UPDATED" ? 6 : state ? 3 : 0; return <section className="workflow"><div className="section-label"><span>LIVE WORKFLOW</span><span className="live-label"><i className="pulse" />{state ? state.replaceAll("_", " ") : "AWAITING REQUEST"}</span></div><div className="workflow-track">{steps.map((step, index) => <div className={`workflow-step ${index < active ? "done" : ""} ${index === active ? "active" : ""} ${state === "BLOCKED" && index === active ? "blocked" : ""}`} key={step}><div className="step-dot">{index < active ? <Check size={13} /> : index + 1}</div><span>{step}</span>{index < steps.length - 1 && <div className="step-line" />}</div>)}</div></section>; }
 function DecisionCard({ current, scenario, authority, blocked, approval, verified, failed, run, resolve, mutateAction, loading }: { current?: ActionRecord; scenario: DemoScenario; authority: AutonomyLevel; blocked: boolean; approval: boolean; verified: boolean; failed: boolean; run: () => void; resolve: () => void; mutateAction: (path: string) => Promise<void>; loading: boolean }) {
  const decision = current?.decision; const status = blocked ? "BLOCKED" : approval ? "APPROVAL REQUIRED" : verified ? "VERIFIED" : failed ? "VERIFICATION FAILED" : current?.state === "TRUST_UPDATED" ? "AUTHORIZED" : "READY TO EVALUATE"; const tone = blocked || failed ? "danger" : approval ? "warning" : verified ? "success" : "neutral";
   return <section className={`decision-card ${tone}`}><div className="card-topline"><span className="section-label">CURRENT DECISION</span><span className="decision-id">VOUCH / {current?.action.id ?? "NO ACTIVE ACTION"}</span></div><div className="decision-status"><div className="status-icon">{blocked ? <Ban /> : approval ? <LockKeyhole /> : verified ? <Check /> : failed ? <ShieldAlert /> : <Radio />}</div><div><span className="mini-label">DECISION STATUS</span><h2>{status}</h2></div><div className="decision-knight"><KnightAuthority level={authority} state={blocked ? "blocked" : approval ? "approval" : verified ? "verified" : failed ? "reduced" : "deployment"} size="small" /></div><span className={`risk-badge ${scenario.action.risk.toLowerCase()}`}>{scenario.action.risk} RISK</span></div>{decision && <AuthorityGate authorization={decision.authorization} />}{blocked && <div className="blocked-banner"><KnightAuthority level={authority} state="blocked" size="small" /><div><b>VOUCH STOPPED THE ACTION</b><span>The agent identified a conflict and did not have sufficient authoritative evidence to safely proceed.</span></div></div>}<div className="action-request"><span className="mini-label">PROPOSED ACTION</span><h3>{scenario.action.title}</h3><p>{scenario.action.detail}</p></div><div className="decision-metrics"><Metric label="EVIDENCE" value={`${current?.decision ? scenario.evidence.length : 0} sources`} /><Metric label="CONFIDENCE" value={decision ? `${decision.confidence}%` : "—"} /><Metric label="REVERSIBILITY" value={scenario.action.reversibility.replace("_", " ")} /><Metric label="AUTHORITY" value={decision?.authority?.split(" · ")[0] ?? "Pending"} /></div><div className={`decision-reason ${tone}`}><span className="mini-label">{blocked ? "WHY VOUCH STOPPED THE AGENT" : approval ? "WHY APPROVAL IS REQUIRED" : failed ? "OUTCOME DID NOT MATCH EXPECTATION" : verified ? "OUTCOME VERIFIED" : "SYSTEM POSITION"}</span><p>{current?.verification?.message ?? decision?.reason ?? "Select a deterministic scenario from the Demo Center to begin."}</p>{blocked && <div className="stop-callout"><ShieldAlert size={15} />{scenario.hasInjection ? "Untrusted instruction detected. Instruction is data, not authority." : "Authoritative policy and secondary communication disagree."}</div>}{failed && current?.verification && <div className="failure-delta"><span>TRUST IMPACT <b>{current.trustImpact && current.trustImpact > 0 ? `+${current.trustImpact}` : current.trustImpact ?? "—"}</b></span><span>AUTONOMY <b>REDUCED</b></span></div>}{verified && <div className="verified-list"><span><Check size={13} /> Executed</span><span><Check size={13} /> Expected outcome confirmed</span><span><Check size={13} /> Audit record created</span></div>}</div><div className="decision-actions">{blocked && scenario.hasConflict && <><button className="button primary" onClick={resolve}><RefreshCw size={15} />Resolve conflict</button><button className="button ghost" onClick={run}>Re-run action</button></>}{approval && <><button className="button primary" disabled={loading} onClick={() => current && mutateAction(`/api/actions/${current.action.id}/approve`)}><Check size={15} />Approve</button><button className="button ghost danger-text" disabled={loading} onClick={() => current && mutateAction(`/api/actions/${current.action.id}/reject`)}><X size={15} />Reject</button></>}{(!current || verified || failed) && <button className="button primary" onClick={run} disabled={loading}><Play size={15} />{loading ? "Evaluating…" : "Run scenario"}</button>}<span className="decision-footnote"><LockKeyhole size={13} /> Enforced server-side</span></div></section>;
}
 function AuthorityGate({ authorization }: { authorization: AuthorizationDecision }) {
   const gateState = authorization === "EXECUTE" ? "allow" : authorization === "APPROVAL_REQUIRED" ? "approval" : "block";
   const gateLabel = authorization === "EXECUTE" ? "ALLOW" : authorization === "APPROVAL_REQUIRED" ? "APPROVAL REQUIRED" : "BLOCK";
   return <div className={`authority-gate gate-${gateState}`}><span className="gate-agent">AGENT</span><ArrowRight size={13} /><div className="gate-core"><ShieldCheck size={14} /><b>VOUCH GATE</b><small>{gateLabel}</small></div><ArrowRight size={13} /><span className="gate-action">ACTION</span></div>;
 }
 function Metric({ label, value }: { label: string; value: string }) { return <div><span className="mini-label">{label}</span><b>{value}</b></div>; }
function ActivityPanel({ session }: { session: SessionState }) { return <section className="activity-panel"><div className="panel-heading"><div><span className="section-label">AGENT ACTIVITY</span><p>Operational record · live session</p></div><span className="live-pill"><i className="pulse" />LIVE</span></div><div className="activity-list">{session.activity.map((item, index) => <div className={`activity-item ${index === 0 ? "latest" : ""}`} key={`${item}-${index}`}><span className="activity-dot">{index === 0 ? <i className="pulse" /> : <Check size={11} />}</span><span>{item}</span><time>{index === 0 ? "now" : `${index * 2 + 1}s ago`}</time></div>)}</div><div className="agent-note"><KnightAuthority level={session.trust.autonomy} size="small" state={session.trust.autonomy === "T2" ? "investigating" : "verified"} /><div><span className="mini-label">CURRENT AUTHORITY NOTE</span><p>“The safest action is the one the current evidence can support.”</p></div></div></section>; }
function EvidencePanel({ evidence }: { evidence: EvidenceItem[] }) { const [expanded, setExpanded] = useState<string | null>(null); return <section className="evidence-panel"><div className="panel-heading"><div><span className="section-label">EVIDENCE LEDGER</span><p>Structured sources · authority weighted</p></div><span className="source-count">{evidence.length} SOURCES</span></div><div className="evidence-list">{evidence.map((item) => <button className={`evidence-item ${item.authority.toLowerCase()}`} onClick={() => setExpanded(expanded === item.id ? null : item.id)} key={item.id}><div className="evidence-icon">{item.authority === "UNTRUSTED" ? <ShieldAlert size={16} /> : item.authority === "AUTHORITATIVE" ? <LockKeyhole size={16} /> : <FileCheck2 size={16} />}</div><div className="evidence-main"><div className="evidence-title"><b>{item.source}</b><span className={`authority ${item.authority.toLowerCase()}`}>{item.authority}</span></div><p>{item.finding}</p>{expanded === item.id && <div className="evidence-detail"><span>{item.content}</span><small>{item.sourceType} · {item.confidence}% confidence · {item.verification}</small></div>}</div><ChevronDown className={expanded === item.id ? "rotate" : ""} size={16} /></button>)}</div></section>; }
function TrustHistory({ trust, events }: { trust: SessionState["trust"]; events: SessionState["trustHistory"] }) { return <section className="trust-history"><div className="panel-heading"><div><span className="section-label">TRUST HISTORY</span><p>Outcome-driven standing</p></div><button className="icon-button" aria-label="Trust explanation"><CircleHelp size={16} /></button></div><div className="trust-timeline">{events.length ? events.slice(0, 4).map((event) => <div className="trust-event" key={event.id}><div className={`trust-event-dot ${event.to < event.from ? "down" : "up"}`} /><div><div className="trust-change"><b>{event.from}</b><ArrowRight size={13} /><b className={event.to < event.from ? "down-text" : ""}>{event.to}</b><span>{event.to < event.from ? "DECREASE" : "INCREASE"}</span></div><p>{event.reason}</p><small>{event.autonomyFrom} {autonomyName(event.autonomyFrom)} → {event.autonomyTo} {autonomyName(event.autonomyTo)}</small></div></div>) : <div className="empty-trust">No verified outcomes in this session yet.</div>}</div><div className="trust-footer"><span><span className="mini-label">RELIABILITY</span><b>{trust.reliability}%</b></span><span><span className="mini-label">SUCCESSFUL</span><b>{trust.verifiedActions}</b></span><span><span className="mini-label">FAILURES</span><b>{trust.verificationFailures}</b></span></div></section>; }

function Architecture({ navigate }: { navigate: (v: View) => void }) {
  return <div className="architecture content-width">
    <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" />THE ADAPTIVE AUTHORITY BOUNDARY</div><h1>The agent recommends.<br /><em>VOUCH decides—again.</em></h1><p>Every request crosses the same server-side boundary, regardless of past success.</p></div><div className="architecture-note"><LockKeyhole size={17} /><span><b>Deterministic and per-request</b><small>Model output and prior approval never grant future permission.</small></span></div></div>
    <div className="arch-diagram">
      <div className="arch-column arch-agent-column"><div className="arch-column-heading"><span className="arch-index">01 / AWS MODEL LAYER</span><h2>Strands + Bedrock</h2><p>Orchestrates inspection and returns a recommendation.</p></div><div className="arch-stack-card"><Layers3 size={17} /><div><b>STRANDS AGENTS SDK</b><span>Typed tools and structured recommendation</span></div></div><div className="arch-stack-card"><CloudIcon /><div><b>AMAZON BEDROCK</b><span>Model inference through the configured model</span></div></div><div className="arch-callout"><span>OUTPUT</span><b>Recommendation only</b><small>The model cannot authorize or execute.</small></div></div>
       <div className="arch-boundary"><LockKeyhole size={18} /><span>VOUCH<br />GATE</span><small>ALLOW · APPROVAL · BLOCK</small><ArrowRight size={18} /></div>
      <div className="arch-column arch-vouch-column"><div className="arch-column-heading"><span className="arch-index">02 / VOUCH AUTHORITY LAYER</span><h2>Fresh deterministic authority</h2><p>History + evidence + risk + policy + context + hard limits decide what happens now.</p></div><div className="arch-control-grid"><div className="arch-stack-card"><ScanSearch size={17} /><div><b>CURRENT REQUEST</b><span>Evidence, context, risk, reversibility</span></div></div><div className="arch-stack-card key-node"><ShieldCheck size={17} /><div><b>AUTHORITY ENGINE</b><span>EXECUTE · APPROVAL REQUIRED · BLOCKED</span></div></div><div className="arch-stack-card"><Activity size={17} /><div><b>ACTION + VERIFY</b><span>Compare expected and actual state</span></div></div><div className="arch-stack-card"><BadgeCheck size={17} /><div><b>ADJUST + AUDIT</b><span>Update standing, preserve provenance, evaluate again</span></div></div></div></div>
    </div>
    <section className="knight-progression" id="knight-progression"><div className="arch-section-heading"><span className="section-kicker">SERVER AUTHORITY → VISUAL STATE</span><h2>One guardian.<br /><em>Four unmistakable tiers.</em></h2><p>Equipment appears and disappears only when the server-provided authority level changes.</p></div><div className="knight-progression-grid">{([["T1", "UNARMORED", "No equipment"], ["T2", "ARMORED APPRENTICE", "Armor · no weapons"], ["T3", "ARMED SQUIRE", "Armor · shield · sword"], ["T4", "MOUNTED KNIGHT", "Full equipment · horse"]] as const).map(([level, title, detail]) => <div className={`knight-tier-card knight-tier-${level}`} key={level}><KnightAuthority level={level} state="deployment" /><span>{level}</span><b>{title}</b><small>{detail}</small></div>)}</div></section>
    <section className="arch-aws-strip"><div className="arch-section-heading"><span className="section-kicker">AWS IN THE BUILD</span><h2>Real services.<br /><em>Clear boundaries.</em></h2><p>The AWS path is optional for the demo, but explicit in the architecture.</p></div><div className="arch-aws-grid"><div><CloudIcon /><b>AMAZON BEDROCK</b><span>Inference layer for the Strands agent</span></div><div><Layers3 /><b>STRANDS AGENTS</b><span>Agent orchestration and typed tools</span></div><div><Activity /><b>AGENTCORE / CLOUDWATCH</b><span>Deployment and observability path</span></div></div></section>
    <section className="feedback-loop-box"><div className="section-kicker">THE ADAPTIVE AUTHORITY LOOP</div><b>REQUEST → DECISION → OUTCOME → STANDING UPDATE → NEXT REQUEST</b><p>Verification changes the state the authority engine considers next time. It never pre-authorizes the next action; evidence, risk, policy, context, and hard limits are evaluated again.</p></section>
    <section className="arch-contest-proof"><div className="arch-section-heading"><span className="section-kicker">CONTEST PROOF</span><h2>What this build<br /><em>demonstrates.</em></h2></div><div className="arch-proof-grid"><div><span>01</span><b>AGENTIC AI</b><p>Strands coordinates evidence inspection and produces a structured recommendation.</p></div><div><span>02</span><b>SERVER AUTHORITY</b><p>Deterministic policy—not model output or client state—grants, escalates, or blocks each request.</p></div><div><span>03</span><b>BOUNDED ADAPTATION</b><p>Verified history changes available authority while hard limits remain in force.</p></div><div><span>04</span><b>JUDGE-READY PROOF</b><p>The same action class receives different decisions after verified behavior changes.</p></div></div></section>
    <div className="arch-bottom"><div><span className="section-kicker">THE BOUNDARY</span><h2>LLM proposes.<br />Policy disposes.</h2></div><p>VOUCH treats evidence as structured data, ranks its authority, calculates action risk, and uses current earned standing to determine whether the system may act. Verification then changes what can happen next.</p></div><PageCta title="Ready to see it work?" text="Run a controlled lifecycle with no setup or API key." label="Experience VOUCH" onClick={() => navigate("demo")} />
  </div>;
}

function CloudIcon() { return <span className="cloud-icon"><Cloud size={17} /></span>; }
function HistoryView({ session, navigate }: { session: SessionState; navigate: (v: View) => void }) { return <div className="history-page content-width"><div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" />AUTHORITY HISTORY / AUDIT</div><h1>Why does this agent have<br /><em>its current authority?</em></h1><p>Evidence, outcome, standing change, and authority consequence remain connected in one operational record.</p></div><div className="history-guardian"><KnightAuthority level={session.trust.autonomy} size="small" state="audit" /><div className="history-summary"><b>{session.trust.autonomy}</b><span>{autonomyName(session.trust.autonomy)} · reliability {session.trust.score}</span></div></div></div><section className="authority-history"><div className="panel-heading"><div><span className="section-label">EVIDENCE → OUTCOME → STANDING → AUTHORITY</span><p>Latest transition first · every future request is still evaluated</p></div><span className="source-count">{session.trustHistory.length} CHANGES</span></div>{session.trustHistory.length ? <div className="authority-transition-list">{session.trustHistory.map((event) => <div className={`authority-transition ${event.to < event.from ? "lost" : "earned"}`} key={event.id}><span>{event.to < event.from ? "AUTHORITY REDUCED" : event.reason.toLowerCase().includes("restored") ? "AUTHORITY RESTORED" : event.autonomyFrom !== event.autonomyTo ? "AUTHORITY EARNED" : "STANDING UPDATED"}</span><b>{event.from} → {event.to}</b><ArrowRight size={14} /><strong>{event.autonomyFrom} {autonomyName(event.autonomyFrom)} → {event.autonomyTo} {autonomyName(event.autonomyTo)}</strong><p>{event.reason}</p></div>)}</div> : <div className="empty-history"><History size={22} /><b>No authority transitions yet</b><span>Begin the adaptive authority proof to create the first outcome-driven change.</span></div>}</section><div className="audit-table"><div className="audit-head"><span>EVENT</span><span>ACTION</span><span>STATUS</span><span>RISK</span><span>TIME</span></div>{session.audit.length ? session.audit.map((event) => <div className="audit-row" key={event.id}><div><span className="audit-icon"><Check size={14} /></span><b>{event.type === "APPROVAL_REQUESTED" ? "APPROVAL REQUIRED" : event.type === "ACTION_COMPLETED" && event.verification?.status === "FAIL" ? "VERIFICATION FAILED" : event.type === "ACTION_COMPLETED" ? "OUTCOME VERIFIED" : event.type.replaceAll("_", " ")}</b><small>{event.actor} · {event.result}</small></div><span className="mono">{event.actionId.replace("act-", "")}</span><span className={`audit-status ${event.status.toLowerCase()}`}>{event.status}</span><span className={`risk-badge ${event.risk.toLowerCase()}`}>{event.risk}</span><time>{new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></div>) : <div className="empty-history"><History size={22} /><b>No audit events yet</b><span>Run a scenario to create the first operational record.</span></div>}</div><button className="back-to-demo" onClick={() => navigate("demo")}><Play size={14} /> Experience the adaptive authority proof</button></div>; }

export default App;