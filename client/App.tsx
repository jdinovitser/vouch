import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  Activity, ArrowDown, ArrowRight, BadgeCheck, Ban, BookOpen, Check, ChevronDown, ChevronRight, Cloud,
  CircleHelp, Database, FileCheck2, Fingerprint, Gauge, History, Layers3, LockKeyhole,
  Menu, Play, Radio, RefreshCw, ScanSearch, ShieldAlert, ShieldCheck, Sparkles, Users,
  X, Zap,
} from "lucide-react";
import type { ActionRecord, AgentMetrics, AgentRecommendation, AgentTrust, AutonomyLevel, AuthorizationDecision, ClaimsCase, DemoScenario, EvidenceItem, SessionState } from "../shared/types";
import { CelebrationKnight, KnightArtwork, KnightAuthority, knightLabels, type KnightState } from "./Knight";

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
       {view === "demo" && data && <DemoExperience session={data.session} scenarios={data.scenarios} runScenario={runScenario} mutateAction={mutateAction} resetSession={resetSession} loading={loading} navigate={navigate} />}
        {view === "judges" && data && <JudgesPage session={data.session} scenarios={data.scenarios} runScenario={runScenario} mutateAction={mutateAction} resetSession={resetSession} loading={loading} navigate={navigate} />}
      {view === "architecture" && <Architecture navigate={navigate} />}
      {view === "control" && data && <ControlCenter data={data} runScenario={runScenario} mutateAction={mutateAction} setToast={setToast} loading={loading} navigate={navigate} />}
      {view === "history" && data && <HistoryView session={data.session} navigate={navigate} />}
    </main>
    <Footer navigate={navigate} />
    {toast && <div className="toast"><ShieldAlert size={17} />{toast}<button onClick={() => setToast("")}><X size={14} /></button></div>}
  </div>;
}

function EarnedAutonomyStrip({ view }: { view: View }) {
  if (view === "judges" || view === "control") return null;
  const copy = view === "demo"
      ? "The signature proof: PROVE → EARN → ACT → VERIFY → ADJUST."
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
const money = (amount: number) => `$${amount.toLocaleString()}`;

function Footer({ navigate }: { navigate: (v: View) => void }) {
  return <footer><div className="footer-brand"><img src="/vouch-mark.svg" /> VOUCH</div><div className="footer-links"><button onClick={() => navigate("why")}>Why VOUCH</button><button onClick={() => navigate("how")}>How it works</button><button onClick={() => navigate("demo")}>Demo</button><button onClick={() => navigate("judges")}>For judges</button></div><span>Adaptive authority for AI agents</span></footer>;
}

function Landing({ navigate, trust }: { navigate: (v: View) => void; trust?: AgentTrust }) {
  return <div className="landing">
    <section className="landing-hero content-width">
      <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line" />CLAIMS RESOLUTION AGENT FOR PROFESSIONAL TEAMS</div><h1>Resolve routine claims.<br /><em>Escalate only what needs judgment.</em></h1><p className="hero-lead">VOUCH investigates evidence, checks policy, resolves eligible cases, and verifies every outcome. Professionals see the exceptions; the agent earns bounded authority through proven work.</p><div className="earned-loop"><b>INVESTIGATE</b><i /><b>RESOLVE</b><i /><b>VERIFY</b><i /><b>ADJUST</b></div><div className="hero-actions"><button className="button primary" onClick={() => navigate("control")}><Zap size={16} />Open the claims queue <ArrowRight size={16} /></button><button className="button ghost" onClick={() => navigate("demo")}>Watch a case resolve <ChevronRight size={16} /></button></div><div className="hero-proof"><span><ShieldCheck size={16} /> Routine cases move automatically</span><span><Users size={16} /> Exceptions reach professionals</span><span><Fingerprint size={16} /> Every outcome is verified</span></div></div>
      <HeroVisual level={trust?.autonomy ?? "T2"} />
    </section>
    <section className="roi-ribbon"><div className="content-width"><span className="ribbon-kicker">THE DIFFERENCE</span><div className="ribbon-message"><b>Static permissions say “may.”</b><b>VOUCH asks “has earned?”</b><b>Authority can return—or be taken away.</b></div><button onClick={() => navigate("why")}>See the distinction <ArrowRight size={15} /></button></div></section>
    <section className="why content-width"><div className="section-kicker">THE QUESTION HAS CHANGED</div><h2>Don’t ask if the AI can do it.<br /><em>Ask if it has earned the authority.</em></h2><p className="section-intro">VOUCH continuously evaluates evidence, risk, authority, and outcomes before allowing an agent to take consequential action.</p><div className="principles"><Principle number="01" title="MOVE FASTER" text="Let agents autonomously handle routine, low-risk work." icon={<Zap />} /><Principle number="02" title="CONTROL RISK" text="Prevent unsupported or unauthorized actions before they happen." icon={<ShieldCheck />} /><Principle number="03" title="SCALE TRUST" text="Increase autonomy as agents demonstrate reliable behavior." icon={<Sparkles />} /></div></section>
     <section className="trust-manifesto content-width"><div><span className="section-kicker">THE VOUCH PROMISE</span><h2>The goal isn’t maximum autonomy.<br /><span>It’s the right authority, right now.</span></h2><p>Authority is earned through evidence, constrained by policy, and revoked when behavior proves unreliable.</p></div><button className="text-link" onClick={() => navigate("demo")}>Watch the same agent change authority <ArrowRight size={17} /></button></section>
  </div>;
}

function HeroVisual({ level }: { level: AutonomyLevel }) {
  const statusCopy = level === "T4" ? "Delegated within defined boundaries." : level === "T3" ? "Ready to act within earned boundaries." : level === "T2" ? "Learning through verified outcomes." : "Observe and recommend; do not act.";
  return <div className="hero-visual"><div className="hero-orbit orbit-a" /><div className="hero-orbit orbit-b" /><div className="hero-grid" /><div className="guardian-card authority-card"><div className="guardian-halo hero-warrior"><KnightAuthority level="T3" size="normal" /></div><span className="guardian-label">T3 WARRIOR / ACT</span><b>Bounded authority in action.</b><div className="guardian-scan"><i />hero example <span>T3 · ACT</span></div></div><div className="trust-float"><div className="mini-label">LIVE SERVER AUTHORITY</div><div className="float-score">{level}<span> · {autonomyName(level)}</span></div><div className="float-track"><i style={{ width: `${level === "T1" ? 25 : level === "T2" ? 50 : level === "T3" ? 75 : 100}%` }} /></div><div className="float-row"><span>{statusCopy}</span><b>BOUNDED</b></div></div></div>;
}

function Guardian({ state = "default", size = "normal", celebrating = false }: { state?: KnightState; size?: "normal" | "small"; celebrating?: boolean }) {
  return <div className={`guardian guardian-${state} guardian-${size} ${celebrating ? "guardian-celebrating" : ""}`}><div className="guardian-art">{state === "default" ? <img className="canonical-knight" src="/vouch-mascot.svg" alt="VOUCH Knight ready" /> : <KnightArtwork state={state} />}<span className="wink-eye" aria-hidden="true" /></div><span className="guardian-state">{knightLabels[state]}</span></div>;
}

function Principle({ number, title, text, icon }: { number: string; title: string; text: string; icon: ReactNode }) {
  return <article className="principle"><div className="principle-head"><span>{number}</span><div className="principle-icon">{icon}</div></div><h3>{title}</h3><p>{text}</p><div className="principle-rule" /></article>;
}

function WhyVouch({ navigate }: { navigate: (v: View) => void }) {
  return <div className="story-page why-page content-width"><StoryHero kicker="WHY VOUCH" title={<>Permissions say what an agent can do.<br /><em>VOUCH decides what it has earned.</em></>} text="Static credentials cannot account for whether the last action worked—or whether this request is still within policy. VOUCH evaluates both, every time." mascot="blocked" heroArtwork="warrior" cta="Watch authority adjust" onClick={() => navigate("demo")} /><section className="story-section"><div className="section-kicker">THE AUTHORITY DILEMMA</div><h2>Static permission is blind.<br />Unlimited autonomy is brittle.</h2><p className="story-lead">An agent that can modify records, approve transactions, trigger workflows, or change system state is an operational actor. Its authority must adapt without becoming a permanent whitelist.</p><div className="option-grid"><Option title="NO AUTHORITY" tag="Safe, but slow." text="Every action requires a human. Humans become the bottleneck and automation becomes glorified assistance." tone="muted" /><Option title="STATIC PERMISSION" tag="Fast, but blind." text="The credential stays the same after a bad outcome. Past approval becomes permanent access." tone="danger" /><Option title="ADAPTIVE AUTHORITY" tag="Earned and bounded." text="History informs authority. Current evidence, risk, policy, context, and hard limits still bound every decision." tone="success" /></div></section><section className="value-section"><div><div className="section-kicker">WHAT VOUCH CHANGES</div><h2>History changes authority.<br /><em>Authority never eliminates evaluation.</em></h2></div><div className="change-list"><Change from="Every consequential action needs a human." to="Humans focus on actions that actually require judgment." /><Change from="Agents receive static permissions." to="Authority adapts to verified reliability and current context." /><Change from="Past approval acts like a whitelist." to="Every request receives a fresh server-side decision." /><Change from="Trust is treated as permission." to="Trust informs authority; policy bounds it." /></div></section><RoiSection /><section className="why-now"><div className="section-kicker">WHY NOW</div><h2>When AI can act,<br /><em>authorization becomes part of the product.</em></h2><div className="automation-ladder"><span>Traditional automation <b>executes a predefined workflow</b></span><ArrowRight /><span>Generative AI <b>produces an answer</b></span><ArrowRight /><span className="current">Agentic AI <b>requires adaptive authority</b></span></div></section><PageCta title="Let reliable agents handle more work." text="Without turning successful history into permanent permission." label="See how it works" onClick={() => navigate("how")} /></div>;
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
  return <div className="story-page how-page content-width"><StoryHero kicker="HOW VOUCH WORKS" title={<>Authority adapts.<br /><em>Authorization stays per-request.</em></>} text="Every proposed action receives a fresh server-side decision using verified history, current evidence, risk, policy, context, and hard safety limits." mascot="warrior" cta="Run the guided demo" onClick={() => navigate("demo")} /><section className="lifecycle"><div className="lifecycle-intro"><div className="section-kicker">THE AUTHORITY LIFECYCLE</div><h2>Every request.<br /><em>A fresh decision.</em></h2><p>The model recommends. VOUCH evaluates the current request. Verification adjusts standing for the next request—it never creates a permanent whitelist.</p></div><div className="lifecycle-list">{stages.map(([number, title, text], index) => <div className={`lifecycle-row ${title === "AUTHORITY" ? "authority-row" : ""}`} key={title}><span>{number}</span><div className="lifecycle-marker">{index < 4 ? <Check size={14} /> : <span />}</div><div><b>{title}</b><p>{text}</p></div><div className="lifecycle-knight"><Guardian state={stageKnight[title]} size="small" /></div>{index < stages.length - 1 && <ArrowDown />}</div>)}</div></section><section className="autonomy-section" id="authority-levels"><div className="section-kicker">BOUNDED AUTHORITY LEVELS</div><h2>Standing expands capability.<br /><em>Policy defines the ceiling.</em></h2><div className="autonomy-steps">{([["T1", "OBSERVE", "Inspect and explain, but do not change external state."], ["T2", "RECOMMEND", "Take bounded low-risk actions; escalate consequential ones."], ["T3", "ACT", "Execute eligible medium-risk actions within current policy."], ["T4", "DELEGATE", "Operate across broader approved scopes; hard limits still apply."]] as const).map(([level, name, text], index) => <div className={`autonomy-step level-${level}`} key={level}><span>{level}</span><KnightAuthority level={level} size="small" state="deployment" /><b>{name}</b><p>{text}</p>{index < 3 && <ArrowRight />}</div>)}</div><p className="autonomy-note"><ShieldAlert size={15} /> High-risk, irreversible, conflicted, or policy-bound actions do not become autonomous merely because standing is high.</p></section><section className="trust-product"><CelebrationKnight size="small" /><div><div className="section-kicker">THE FEEDBACK LOOP</div><h2>PROVE → EARN → ACT.<br /><em>VERIFY → ADJUST.</em></h2></div><div className="trust-loop"><span>Verified history</span><ArrowRight /><b>Current standing</b><ArrowRight /><span>Fresh authority decision</span><strong>Bounded by</strong><span>Evidence + risk</span><ArrowRight /><b>Policy + context</b><ArrowRight /><span>Hard safety limits</span></div></section><PageCta title="See the decision in motion." text="Watch one agent earn, lose, and conditionally recover bounded authority." label="Run the demo" onClick={() => navigate("demo")} /></div>;
}

function StoryHero({ kicker, title, text, mascot, heroArtwork, cta, onClick }: { kicker: string; title: ReactNode; text: string; mascot: KnightState | "warrior"; heroArtwork?: "warrior"; cta: string; onClick: () => void }) {
  const isWarrior = mascot === "warrior" || heroArtwork === "warrior";
  return <section className="story-hero"><div><div className="eyebrow"><span className="eyebrow-line" />{kicker}</div><h1>{title}</h1><p>{text}</p><button className="button primary" onClick={onClick}>{cta}<ArrowRight size={16} /></button></div><div className="story-hero-visual"><div className="hero-orbit orbit-a" />{isWarrior ? <KnightAuthority level="T3" size="normal" state="deployment" /> : <Guardian state={mascot} />}<div className="hero-state-card"><span className="mini-label">VOUCH PRINCIPLE</span><b>{mascot === "investigating" ? "Evidence before authority." : mascot === "blocked" ? "Protection is a successful outcome." : isWarrior ? "T3 Warrior: bounded action." : "The agent recommends."}</b><small>Policy decides whether it may act.</small></div></div></section>;
}
function PageCta({ title, text, label, onClick }: { title: string; text: string; label: string; onClick: () => void }) { return <section className="page-cta"><div><h2>{title}</h2><p>{text}</p></div><button className="button primary" onClick={onClick}>{label}<ArrowRight size={16} /></button></section>; }

function DemoExperience({ session, scenarios, runScenario, mutateAction, resetSession, loading, navigate }: { session: SessionState; scenarios: DemoScenario[]; runScenario: (id: string, stayOnDemo?: boolean) => Promise<void>; mutateAction: (path: string) => Promise<void>; resetSession: () => Promise<void>; loading: boolean; navigate: (v: View) => void }) {
  const [scenarioId, setScenarioId] = useState("safe-review");
  return <div className="demo-experience content-width">
    <div className="demo-hero-heading"><div><div className="eyebrow"><span className="eyebrow-line" />THE ADAPTIVE AUTHORITY PROOF</div><h1>One agent.<br /><em>Every request reevaluated.</em></h1><p>Watch verified history change available authority without bypassing current evidence, risk, policy, context, or hard safety limits.</p></div><KnightAuthority level={session.trust.autonomy} size="normal" state="deployment" /></div>
    <EarnedLifecycleDemo session={session} scenarios={scenarios} runScenario={runScenario} mutateAction={mutateAction} resetSession={resetSession} loading={loading} />
    <section className="demo-outcome"><div><span className="section-kicker">EXPLORE THE SAFETY BOUNDARY</span><h2>One authority engine.<br /><em>Five honest answers.</em></h2><p>After the lifecycle proof, inspect independent blocked, approval-required, execution, injection-defense, and verification outcomes.</p></div><div className="scenario-rail">{scenarios.filter((scenario) => !scenario.recovery && scenario.id !== "recovered-account-update").map((scenario) => <button className={`scenario-mini ${scenario.accent} ${scenario.id === scenarioId ? "selected" : ""}`} onClick={() => { setScenarioId(scenario.id); void runScenario(scenario.id); }} disabled={loading} key={scenario.id}><span className="mini-label">{scenario.action.risk} RISK</span><b>{scenario.name}</b><small>{scenario.hasConflict ? "VOUCH stops" : scenario.id === "human-refund" ? "Human decides" : scenario.failVerification ? "Trust reduces" : "Agent acts"}</small><ArrowRight size={14} /></button>)}</div></section>
    <PageCta title="Want the technical boundary?" text="The model recommends. The VOUCH authorization layer decides." label="Explore architecture" onClick={() => navigate("architecture")} />
  </div>;
}

function JudgesPage({ session, scenarios, runScenario, mutateAction, resetSession, loading, navigate }: { session: SessionState; scenarios: DemoScenario[]; runScenario: (id: string, stayOnDemo?: boolean) => Promise<void>; mutateAction: (path: string) => Promise<void>; resetSession: () => Promise<void>; loading: boolean; navigate: (v: View) => void }) {
  const runtime = session.service.mode === "AWS_LIVE"
    ? [["AWS LIVE · STRANDS AGENTS", "Successful model recommendation"], ["AMAZON BEDROCK", session.service.message]]
    : [["DEMO · DETERMINISTIC EVALUATOR", "No live AWS invocation"], ["STRANDS + BEDROCK PATH", "Activates only after a successful invocation"]];
  return <div className="judges-page content-width"><section className="judges-hero"><div><div className="eyebrow"><span className="eyebrow-line" />THE 90-SECOND CLAIMS PROOF</div><h1>Autonomous claims resolution.<br /><em>Controlled authority.</em></h1><p>VOUCH resolves routine claims, stops exceptions for professional judgment, and independently proves whether every authorized change actually worked.</p><div className="hero-actions"><button className="button primary" onClick={() => document.getElementById("judges-demo")?.scrollIntoView({ behavior: "smooth" })}><Play size={16} />Start guided demo</button><button className="button ghost" onClick={() => navigate("architecture")}>Inspect the boundary <ArrowRight size={16} /></button></div></div><div className="judge-stamp"><KnightAuthority level={session.trust.autonomy} size="normal" state="verified" /><span>WHAT TO WATCH</span><b>Recommendation is not permission.<br /><em>Authorized is not verified.</em></b></div></section><section className="judge-takeaways"><div><div className="section-kicker">THE STORY IN 90 SECONDS</div><h2>One queue.<br /><em>Four defensible outcomes.</em></h2></div><div className="judge-timeline">{[["00:00", "Routine claim → verified"], ["00:20", "Exception → approval"], ["00:40", "Bound approval → verified"], ["01:00", "Mismatch → demotion"], ["01:20", "Injection → blocked"]].map(([time, label], index) => <div key={time} className={index === 3 ? "critical" : ""}><time>{time}</time><span /><b>{label}</b></div>)}</div></section><section className="judge-watch"><div className="watch-panel"><div className="section-kicker">WHAT TO NOTICE</div><h2>Follow the<br /><em>separate decisions.</em></h2>{["Strands investigates and recommends.", "VOUCH independently authorizes.", "Only the protected server mutates Postgres.", "A fresh read—not the execution response—verifies the outcome.", "Failures reduce authority and create human work.", "Untrusted evidence never grants permission."].map((item) => <p key={item}><Check size={14} />{item}</p>)}</div><div className="impact-panel"><KnightAuthority level={session.trust.autonomy} size="small" state="verified" /><div className="section-kicker">WHY THIS MATTERS</div><h2>Useful autonomy.<br />Visible accountability.<br /><em>No permanent whitelist.</em></h2><p>VOUCH turns verified history into currently available capability while hard policy limits remain in force.</p></div></section><section id="judges-demo"><EarnedLifecycleDemo session={session} scenarios={scenarios} runScenario={runScenario} mutateAction={mutateAction} resetSession={resetSession} loading={loading} /></section><section className="technical-snapshot"><div><div className="section-kicker">TECHNICAL SNAPSHOT</div><h2>Built for the<br /><em>real world.</em></h2></div><div className="tech-grid">{[...runtime, ["AGENT TOOLS", "Evidence inspection · recommendation"], ["VOUCH AUTHORITY ENGINE", "Fresh deterministic decision per request"], ["POLICY BOUNDARIES", "Hard limits override standing"], ["AUDIT LAYER", "Evidence · outcome · authority provenance"]].map(([name, text]) => <div key={name}><Layers3 size={16} /><b>{name}</b><span>{text}</span></div>)}</div></section></div>;
}

function EarnedLifecycleDemo({ session, scenarios, runScenario, mutateAction, resetSession, loading }: { session: SessionState; scenarios: DemoScenario[]; runScenario: (id: string, stayOnDemo?: boolean) => Promise<void>; mutateAction: (path: string) => Promise<void>; resetSession: () => Promise<void>; loading: boolean }) {
  const current = session.currentAction;
  const hasRoutine = session.history.some((item) => item.action.scenarioId === "safe-review" && item.verification?.status === "PASS");
  const hasApprovalRequest = current?.action.scenarioId === "human-refund" && current.state === "APPROVAL_REQUIRED";
  const hasApprovedException = session.history.some((item) => item.action.scenarioId === "human-refund" && item.verification?.status === "PASS");
  const hasDeclinedException = current?.action.scenarioId === "human-refund" && current.humanDecision === "DECLINED";
  const hasFailed = session.history.some((item) => item.action.scenarioId === "verification-failure" && item.verification?.status === "FAIL");
  const hasReducedAuthorityRetry = current?.action.scenarioId === "verification-failure"
    && current.state === "APPROVAL_REQUIRED"
    && current.decision?.authorityStatus === "EXCEEDS_LIMIT";
  const hasBlockedInjection = session.cases.some((item) => item.scenarioId === "prompt-injection" && item.status === "BLOCKED");
  const phase = hasBlockedInjection ? 5 : hasFailed ? 4 : hasApprovedException ? 3 : hasApprovalRequest || hasDeclinedException ? 2 : hasRoutine ? 1 : 0;
  const stages = ["ROUTINE", "EXCEPTION", "APPROVE", "FAILURE", "SECURITY", "COMPLETE"];
  const headlines = [
    "Resolve a routine duplicate charge.",
    "Stop an exception for professional judgment.",
    "Approve one exact action instance.",
    "Prove that authorized does not mean verified.",
    "Block instructions hidden in untrusted evidence.",
    "A skeptical judge can replay every outcome.",
  ];
  const descriptions = [
    "The agent gathers evidence and policy, recommends resolution, and VOUCH independently authorizes the protected $124 refund.",
    "A $1,240 refund is supported, but policy reserves the consequential decision for a claims professional. No mutation occurs.",
    "The approval is session-, case-, action-, evidence-, version-, and time-bound. It is consumed once before execution and verification.",
    "The command returns, but a fresh Postgres read finds $0 instead of $124. VOUCH fails verification and reduces authority.",
    "A claim attachment says to ignore policy. VOUCH treats the instruction as data, blocks it, and performs no mutation.",
    "Routine, exception, failure, and security paths were driven by real API responses and persisted audit events.",
  ];
  const actions = [
    { label: "Resolve routine $124 claim", run: () => runScenario("safe-review", true) },
    { label: "Open the $1,240 exception", run: () => runScenario("human-refund", true) },
    { label: "Approve this exact action", run: () => current ? mutateAction(`/api/actions/${current.action.id}/approve`) : Promise.resolve() },
    { label: "Run verification-failure case", run: () => runScenario("verification-failure", true) },
    hasReducedAuthorityRetry
      ? { label: "Test untrusted claim content", run: () => runScenario("prompt-injection", true) }
      : { label: "Re-evaluate at reduced authority", run: () => runScenario("verification-failure", true) },
  ];
  const nextAction = hasDeclinedException
    ? { label: "Re-open exception for another decision", run: () => runScenario("human-refund", true) }
    : phase < actions.length ? actions[phase] : undefined;
  const approvalAction = current && hasApprovalRequest ? `/api/actions/${current.action.id}` : undefined;
  const scenario = scenarios.find((item) => item.id === current?.action.scenarioId);
  const lastTrustEvent = session.trustHistory[0];
  return <section className="guided-demo judge-live-demo">
    <div className="demo-topline"><div><span className="section-label">LIVE BACKEND PROOF</span><p>{session.service.message}</p></div><span className="demo-clock running"><Radio size={14} /> ACTUAL SESSION STATE</span></div>
     <ClaimsWorkspace cases={session.cases} metrics={session.metrics} authority={session.trust.autonomy} autonomousLimit={session.trust.autonomousLimit} activeScenarioId={session.activeScenarioId} runScenario={(id) => runScenario(id, true)} loading={loading} />
    <div className="demo-timeline judge-live-timeline">{stages.map((stage, index) => <button className={`${index < phase ? "complete" : ""} ${index === phase ? "current" : ""} ${index > phase ? "future" : ""}`} disabled key={stage}><span>{index < phase ? <Check size={12} /> : String(index + 1).padStart(2, "0")}</span>{stage}{index < stages.length - 1 && <i />}</button>)}</div>
      <div className="demo-stage-card"><div className="stage-graphic"><div className="stage-ring" />{phase === 5 ? <CelebrationKnight size="normal" /> : <KnightAuthority level={session.trust.autonomy} size="normal" state="deployment" />}<span>{phase === 5 ? "PROOF COMPLETE" : `${session.trust.autonomy} · ${autonomyName(session.trust.autonomy)}`}</span></div><div className="stage-copy"><span className="mini-label">ADAPTIVE AUTHORITY / STEP {phase + 1}</span><h2>{hasReducedAuthorityRetry ? "The reduced authority now changes the decision." : hasDeclinedException ? "Professional judgment declined this action." : headlines[phase]}</h2><p>{hasReducedAuthorityRetry ? `The same $124 action now exceeds the agent's ${money(session.trust.autonomousLimit)} earned limit. VOUCH requires authorization before any new mutation.` : hasDeclinedException ? "The professional declined human authorization. The protected action was not executed, autonomous authority did not change, and the decision remains in the audit trail." : descriptions[phase]}</p>{lastTrustEvent && <div className="transition-callout"><span>VERIFIED OUTCOME</span><ArrowRight size={13} /><b>{lastTrustEvent.from} → {lastTrustEvent.to}</b><ArrowRight size={13} /><span className="outcome-authority">{money(lastTrustEvent.authorityFrom)} → {money(lastTrustEvent.authorityTo)}</span></div>}<div className="judge-live-details"><div><span>CURRENT CREDENTIAL</span><b>{session.trust.autonomy} · {autonomyName(session.trust.autonomy)}</b><small>Reliability {session.trust.score}/100 · earned limit {money(session.trust.autonomousLimit)}</small></div><div><span>VOUCH AUTHORITY</span><b>{current?.decision?.authorization ?? "READY"}</b><small>{current?.decision?.authorityStatus === "EXCEEDS_LIMIT" ? "AUTHORITY NOT EARNED" : "Fresh deterministic decision"}</small></div><div><span>CASE RECORD</span><b>{current?.execution?.status ?? "NOT EXECUTED"}</b><small>Server-held claims state mutation</small></div><div><span>VERIFICATION</span><b>{current?.verification?.status ?? "—"}</b><small>{current?.verification ? `${current.verification.expected} / ${current.verification.actual}` : "Expected vs actual"}</small></div><div><span>AGENT RECOMMENDATION</span><b>{current?.agentRecommendation?.recommendation ?? "—"}</b><small>{current?.agentRecommendation?.provider ?? session.service.mode}</small></div><div><span>EVIDENCE PROVENANCE</span><b>{current?.agentRecommendation?.evidenceRefs.length ?? scenario?.evidence.length ?? 0} REFERENCES</b><small>{current?.evidenceVersion ? current.evidenceVersion.slice(0, 12) : "Not evaluated"}</small></div></div></div></div>
      <div className="demo-controls">{approvalAction ? <div className="guided-approval-actions"><span className="guided-approval-label">VOUCH REQUIRES HUMAN AUTHORIZATION</span><button className="control-button primary-control" onClick={() => void mutateAction(`${approvalAction}/approve`)} disabled={loading}><Check size={15} />{loading ? "Recording…" : "Approve as human"}</button><button className="control-button decline-control" onClick={() => void mutateAction(`${approvalAction}/reject`)} disabled={loading}><X size={15} />Decline</button></div> : nextAction ? <button className="control-button primary-control" onClick={() => void nextAction.run()} disabled={loading}><Play size={15} />{loading ? "Evaluating…" : nextAction.label}</button> : <span className="proof-complete"><Check size={15} /> Four-case judge proof verified</span>}<button className="control-button" onClick={() => void resetSession()} disabled={loading}><RefreshCw size={15} />Reset proof</button><span className="decision-footnote"><LockKeyhole size={13} /> Driven by API responses and durable server authorization state</span></div>
     {current && scenario && <><CaseProofPanel session={session} scenario={scenario} /><div className="lower-grid"><EvidencePanel evidence={session.evidence.length ? session.evidence : scenario.evidence} /><TrustHistory trust={session.trust} events={session.trustHistory} /></div></>}
     <ProfessionalImpact metrics={session.metrics} cases={session.cases} />
  </section>;
}

function ProfessionalImpact({ metrics, cases }: { metrics: AgentMetrics; cases: ClaimsCase[] }) {
  const attention = cases.filter((item) => item.status === "APPROVAL_REQUIRED" || item.status === "BLOCKED" || item.status === "VERIFICATION_FAILED").length;
  const autoRate = metrics.casesProcessed ? Math.round(metrics.autonomousResolutions / metrics.casesProcessed * 100) : 0;
  const verificationAttempts = metrics.verifiedOutcomes + metrics.verificationFailures;
  const verificationRate = verificationAttempts ? Math.round(metrics.verifiedOutcomes / verificationAttempts * 100) : 0;
  const reviewRate = metrics.casesProcessed ? Math.round(metrics.humanReviews / metrics.casesProcessed * 100) : 0;
  return <section className="professional-impact">
    <div><span className="section-kicker">MEASURED PROFESSIONAL IMPACT</span><h3>Routine work completed.<br /><em>Judgment reserved for exceptions.</em></h3><p>These values come from the current backend session and change as the Claims Resolution Agent processes cases.</p></div>
     <div><div className="professional-impact-grid"><Metric label="TOTAL CASES" value={String(cases.length)} /><Metric label="AUTONOMOUS" value={`${metrics.autonomousResolutions} · ${autoRate}%`} /><Metric label="HUMAN AUTHORIZED" value={String(metrics.humanAuthorizedActions)} /><Metric label="HUMAN REVIEW" value={`${metrics.humanReviews} · ${reviewRate}%`} /><Metric label="BLOCKED" value={String(metrics.blockedCases)} /><Metric label="VERIFY FAIL" value={String(metrics.verificationFailures)} /><Metric label="VERIFY RATE" value={`${verificationRate}%`} /><Metric label="TIME RETURNED" value={`${metrics.minutesSaved} min`} /></div><div className="impact-comparison"><span><b>Evidence review</b> minutes → seconds</span><span><b>Policy lookup</b> manual → automated</span><span><b>Routine resolution</b> human → eligible autonomy</span><span><b>Outcome verification</b> inconsistent → required</span></div><small className="metric-assumption">Seeded estimate: 14 minutes returned for an autonomous verified resolution; 6 minutes for a human-authorized resolution.</small></div>
  </section>;
}

function ControlCenter({ data, runScenario, mutateAction, setToast: _setToast, loading, navigate }: { data: ApiState; runScenario: (id: string) => Promise<void>; mutateAction: (path: string) => Promise<void>; setToast: (s: string) => void; loading: boolean; navigate: (v: View) => void }) {
  const { session, scenarios } = data; const current = session.currentAction; const scenario = scenarios.find((item) => item.id === session.activeScenarioId) ?? scenarios[1];
  const blocked = current?.state === "BLOCKED"; const approval = current?.state === "APPROVAL_REQUIRED"; const verified = current?.verification?.status === "PASS"; const failed = current?.verification?.status === "FAIL";
  const run = () => runScenario(scenario.id);
   return <div className="control content-width">
      <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" />PROFESSIONAL AGENT / CLAIMS OPERATIONS</div><h1>Resolve routine cases. Surface the exceptions.</h1><p>The agent investigates evidence, checks policy, and completes eligible work while VOUCH keeps consequential decisions in professional hands.</p></div><div className="mode-chip"><i /><span><b>{session.service.mode === "AWS_LIVE" ? "AWS LIVE" : "DETERMINISTIC DEMO FALLBACK"}</b><small>{session.service.message}</small></span></div></div>
       <ClaimsWorkspace cases={session.cases} metrics={session.metrics} authority={session.trust.autonomy} autonomousLimit={session.trust.autonomousLimit} activeScenarioId={session.activeScenarioId} runScenario={runScenario} loading={loading} />
     <AuthorityCredential session={session} scenario={scenario} />
     <section className="state-strip"><TrustPanel trust={session.trust} /><div className="state-divider" /><div className="state-meta"><span className="mini-label">RELIABILITY SIGNAL</span><b>{session.trust.score}/100 · {session.trust.verifiedActions} verified</b><p>This informs authority. It is not permission by itself.</p><div className="level-dots"><i className={session.trust.autonomy === "T1" ? "on" : ""}>T1</i><i className={session.trust.autonomy === "T2" ? "on" : ""}>T2</i><i className={session.trust.autonomy === "T3" ? "on" : ""}>T3</i><i className={session.trust.autonomy === "T4" ? "on" : ""}>T4</i></div></div><div className="state-meta state-meta-right"><span className="mini-label">EVALUATION GUARANTEE</span><div className="health-value"><i className="pulse" />Fresh decision per request</div><p>Past success cannot bypass current policy or hard safety limits.</p><div className="health-counters"><span><b>{session.audit.length}</b> audit events</span><span><b>{session.trust.verificationFailures}</b> failures</span></div></div></section>
     <Workflow state={current?.state} />
      <div className="dashboard-grid"><DecisionCard current={current} scenario={scenario} authority={session.trust.autonomy} autonomousLimit={session.trust.autonomousLimit} blocked={blocked} approval={approval} verified={verified} failed={failed} run={run} resolve={() => current && mutateAction(`/api/actions/${current.action.id}/resolve`)} mutateAction={mutateAction} loading={loading} /><ActivityPanel session={session} /></div>
     {current && <CaseProofPanel session={session} scenario={scenario} />}
     <div className="lower-grid"><EvidencePanel evidence={session.evidence.length ? session.evidence : scenario.evidence} /><TrustHistory trust={session.trust} events={session.trustHistory} /></div>
     <button className="back-to-demo" onClick={() => navigate("demo")}><Play size={14} /> Return to adaptive authority demo</button>
   </div>;
}

function ClaimsWorkspace({ cases, metrics, authority, autonomousLimit, activeScenarioId, runScenario, loading }: { cases: ClaimsCase[]; metrics: AgentMetrics; authority: AutonomyLevel; autonomousLimit: number; activeScenarioId: string; runScenario: (id: string) => Promise<void>; loading: boolean }) {
  const openCases = cases.filter((item) => item.status !== "RESOLVED").length;
  const attentionCases = cases.filter((item) => item.status === "APPROVAL_REQUIRED" || item.status === "BLOCKED" || item.status === "VERIFICATION_FAILED").length;
  const autoRate = metrics.casesProcessed ? Math.round((metrics.autonomousResolutions / metrics.casesProcessed) * 100) : 0;
  const verificationAttempts = metrics.verifiedOutcomes + metrics.verificationFailures;
  const verificationRate = verificationAttempts ? Math.round((metrics.verifiedOutcomes / verificationAttempts) * 100) : 0;
  const nextCase = cases.find((item) => item.status === "NEW");
  return <section className="claims-workspace">
    <div className="claims-summary">
      <div><span className="section-kicker">SEEDED EVALUATION DATASET · POSTGRES-BACKED</span><h2>{openCases} cases waiting.<br /><em>{attentionCases} need human attention.</em></h2><p>Each card is a durable case record. Processing changes Postgres state, creates an audit trail, then reloads the result for independent verification.</p>{nextCase && <button className="button primary process-next" disabled={loading} onClick={() => void runScenario(nextCase.scenarioId)}><Play size={15} />{loading ? "Processing…" : "Process next case"}</button>}</div>
      <div className="impact-metrics">
        <Metric label="PROCESSED" value={String(metrics.casesProcessed)} />
        <Metric label="AUTO-RESOLVED" value={`${autoRate}%`} />
        <Metric label="VERIFIED" value={`${verificationRate}%`} />
        <Metric label="EARNED LIMIT" value={money(autonomousLimit)} />
        <Metric label="TIME RETURNED" value={`${metrics.minutesSaved} min`} />
      </div>
    </div>
    <div className="claims-queue">{cases.map((item) => {
      const isActive = item.scenarioId === activeScenarioId;
      const waiting = item.status === "APPROVAL_REQUIRED" || item.status === "INVESTIGATING";
      return <article className={`claims-case status-${item.status.toLowerCase().replaceAll("_", "-")} ${isActive ? "active" : ""}`} key={item.id}>
        <div className="case-topline"><span>{item.caseNumber}</span><b>{item.status.replaceAll("_", " ")}</b></div>
        <h3>{item.category}</h3><p>{item.summary}</p>
        <div className="case-meta"><span>{item.customer}</span>{item.amount && <span>${item.amount.toLocaleString()}</span>}<span>{item.priority} PRIORITY</span></div>
        {item.lastAction && <small>{item.lastAction}</small>}
        <button disabled={loading || waiting || item.status === "RESOLVED"} onClick={() => void runScenario(item.scenarioId)}>{loading && isActive ? "Processing…" : item.status === "RESOLVED" ? "Verified complete" : item.status === "BLOCKED" ? "Re-evaluate case" : item.status === "VERIFICATION_FAILED" ? "Re-evaluate at reduced authority" : waiting ? "Open decision below" : "Process case"}<ArrowRight size={13} /></button>
      </article>;
    })}</div>
    <div className="claims-impact-note"><Users size={15} /><span><b>PROFESSIONAL IMPACT</b> Routine claims move automatically. Professionals receive focused decisions for policy thresholds, conflicts, and failed outcomes.</span></div>
  </section>;
}

function CaseProofPanel({ session, scenario }: { session: SessionState; scenario: DemoScenario }) {
  const record = session.currentAction;
  if (!record) return null;
  const workCase = session.cases.find((item) => item.id === record.caseId);
  const approval = session.approvals.find((item) => item.id === record.approvalId);
  const policy = scenario.evidence.find((item) => item.sourceType === "policy");
  const events = session.audit.filter((event) => event.caseId === record.caseId).slice().reverse();
  const mutationState = record.execution?.status === "EXECUTED" ? "CASE MUTATED" : record.state === "BLOCKED" || record.state === "APPROVAL_REQUIRED" ? "NO MUTATION" : "PENDING";
  const authorityEvent = session.audit.find((event) => event.caseId === record.caseId && event.trustChange);
  return <section className="case-proof">
    <div className="case-proof-heading"><div><span className="section-kicker">CASE-LEVEL PROOF · {workCase?.caseNumber}</span><h2>The LLM is not the permission system.</h2></div><span className="durable-chip"><Database size={13} /> DURABLE STATE</span></div>
    <div className="case-detail-grid">
      <div><span className="mini-label">CASE</span><b>{workCase?.caseNumber} · {workCase?.category}</b><small>{workCase?.customer} · {workCase?.amount ? `$${workCase.amount.toLocaleString()}` : "No stated amount"} · {workCase?.priority} risk</small></div>
      <div><span className="mini-label">CURRENT STATE</span><b>{workCase?.status.replaceAll("_", " ")}</b><small>Version {workCase?.version} · refund ledger ${workCase?.refundAmount.toLocaleString()}</small></div>
      <div><span className="mini-label">ACTION INSTANCE</span><b>{record.action.id}</b><small>{record.action.title} · {record.action.reversibility.replaceAll("_", " ")}</small></div>
      <div><span className="mini-label">EVIDENCE FRESHNESS</span><b>{record.evidenceVersion.slice(0, 12)}</b><small>{scenario.evidence.length} bound references · fresh decision required after change</small></div>
    </div>
    {record.decision?.requestedAmount !== undefined && <div className={`case-authority-boundary ${record.decision.authorityStatus === "EXCEEDS_LIMIT" ? "exceeded" : "within"}`}><span><small>REQUESTED ACTION</small><b>{money(record.decision.requestedAmount)}</b></span><ArrowRight size={15} /><span><small>EARNED AUTONOMOUS AUTHORITY</small><b>{money(record.decision.autonomousLimit ?? session.trust.autonomousLimit)}</b></span><strong>{record.decision.authorityStatus === "EXCEEDS_LIMIT" ? "AUTHORITY NOT EARNED" : "WITHIN EARNED LIMIT"}</strong></div>}
    <div className="boundary-sequence">
      <div><small>STRANDS RECOMMENDATION</small><b>{record.agentRecommendation?.recommendation ?? "PENDING"}</b><span>{record.agentRecommendation?.provider === "AWS_LIVE" ? "Strands + Bedrock" : "Deterministic demo fallback"} · recommends only</span></div><ArrowRight />
      <div><small>VOUCH AUTHORIZATION</small><b>{record.decision?.authorization ?? "PENDING"}</b><span>Fresh policy and authority decision</span></div><ArrowRight />
      <div><small>PROTECTED ACTION EXECUTION</small><b>{mutationState}</b><span>{record.execution ? "Postgres write committed" : "Protected state unchanged"}</span></div><ArrowRight />
      <div><small>FRESH-READ VERIFICATION</small><b>{record.verification?.status ?? "PENDING"}</b><span>Independent Postgres reload</span></div>
    </div>
    <div className="proof-record-grid">
      <div><span className="mini-label">AGENT · RECOMMENDATION ONLY</span><h3>{record.agentRecommendation?.recommendation ?? "PENDING"}</h3><p>{record.agentRecommendation?.reasoning ?? "The agent has not evaluated this case."}</p><small>Model {record.agentRecommendation?.model ?? "—"} · Tools {record.agentRecommendation?.toolCalls.join(", ") || "—"} · Trace {record.agentRecommendation?.traceId ?? "—"}</small></div>
      <div><span className="mini-label">VOUCH · AUTHORIZATION</span><h3>{record.decision?.authorization ?? "PENDING"}</h3><p>{record.decision?.reason ?? "A fresh server decision is required."}</p><small>Authority {session.trust.autonomy} · {money(session.trust.autonomousLimit)} limit · Policy {record.decision?.policy ?? "—"} · Risk {record.action.risk}</small></div>
      <div><span className="mini-label">AUTHORITY / AUDIT CONSEQUENCE</span><h3>{authorityEvent?.trustChange ? `${money(authorityEvent.trustChange.authorityFrom)} → ${money(authorityEvent.trustChange.authorityTo)}` : "NO CHANGE YET"}</h3><p>{authorityEvent?.result ?? "Authority changes only after independently verified outcomes."}</p><small>Reliability and earned capability remain distinct. Every request is evaluated again.</small></div>
    </div>
     {record.authorizationSource === "HUMAN" && <div className={`human-authorization-proof ${record.humanDecision === "DECLINED" ? "declined" : "approved"}`}>
       <div><span className="mini-label">PROFESSIONAL DECISION</span><h3>{record.humanDecision === "DECLINED" ? "HUMAN AUTHORIZATION DECLINED" : "HUMAN AUTHORIZATION GRANTED"}</h3><p>{record.humanDecision === "DECLINED" ? "The professional retained final authority and chose not to authorize this proposed action." : "The professional accepted responsibility for this exact action after VOUCH determined autonomous authority was not earned."}</p></div>
       <div className="human-proof-steps"><span className={record.humanDecision === "APPROVED" ? "complete" : "complete"}><Check size={13} /> HUMAN {record.humanDecision === "DECLINED" ? "DECISION RECORDED" : "AUTHORIZED"}</span><span className={record.execution?.status === "EXECUTED" ? "complete" : "pending"}>{record.execution?.status === "EXECUTED" ? <Check size={13} /> : <LockKeyhole size={13} />} ACTION {record.execution?.status === "EXECUTED" ? "EXECUTED" : "NOT EXECUTED"}</span><span className={record.verification?.status === "PASS" ? "complete" : "pending"}>{record.verification?.status === "PASS" ? <Check size={13} /> : <LockKeyhole size={13} />} OUTCOME {record.verification?.status === "PASS" ? "VERIFIED" : "NOT VERIFIED"}</span><strong>AUTONOMOUS AUTHORITY: {money(session.trust.autonomousLimit)} · AUTHORITY NOT EARNED</strong></div>
     </div>}
    {record.verification?.status === "FAIL" && <div className="authorized-not-verified"><ShieldAlert size={20} /><div><span>AUTHORIZED ≠ VERIFIED</span><b>The agent was permitted to act, but the resulting durable state could not be proven correct.</b><small>Workflow stopped · authority reduced · professional review required</small></div></div>}
    {record.state === "APPROVAL_REQUIRED" && <div className="approval-packet">
      <div className="approval-title"><LockKeyhole size={18} /><div><span className="mini-label">YOU ARE AUTHORIZING</span><h3>{workCase?.caseNumber} · {record.action.title}</h3></div><b>ACTION-BOUND · SINGLE-USE</b></div>
      <div className="approval-grid">
        <Metric label="CASE" value={`${workCase?.customer ?? "—"} · ${workCase?.category ?? "—"}`} />
        <Metric label="AMOUNT / IMPACT" value={workCase?.amount ? `$${workCase.amount.toLocaleString()} · ${record.action.expectedOutcome}` : record.action.expectedOutcome} />
        <Metric label="POLICY" value={policy?.finding ?? record.decision?.policy ?? "—"} />
        <Metric label="RISK / AUTHORITY" value={`${record.action.risk} · ${session.trust.autonomy}`} />
        <Metric label="AGENT RECOMMENDS" value={record.agentRecommendation?.recommendation ?? "—"} />
      </div>
      <p><b>Why review is required:</b> {record.decision?.reason}</p>
      <div className="approval-outcomes"><span><Check size={13} /><b>If approved</b> Recheck case, evidence, policy, and authority; consume this approval; then execute once.</span><span><X size={13} /><b>If rejected</b> Cancel the action, leave protected refund state unchanged, and preserve the decision in audit.</span></div>
      <small>Bound to session, action {record.action.id}, case version {approval?.caseVersion}, and evidence {approval?.evidenceVersion.slice(0, 12)} · expires {approval?.expiresAt ? new Date(approval.expiresAt).toLocaleTimeString() : "—"}</small>
    </div>}
    {record.verification && <div className={`verification-proof ${record.verification.status.toLowerCase()}`}>
      <div><span className="mini-label">EXPECTED STATE</span><b>{record.verification.expected}</b></div>
      <ArrowRight size={16} />
      <div><span className="mini-label">OBSERVED FROM POSTGRES</span><b>{record.verification.actual}</b></div>
      <div className="verification-result"><span className="mini-label">VERIFICATION</span><b>{record.verification.status}</b><small>{record.verification.status === "FAIL" ? `Authority consequence: ${session.trustHistory[0]?.autonomyFrom} → ${session.trustHistory[0]?.autonomyTo} · human review created` : "Verified outcome may inform future authority"}</small></div>
    </div>}
    <div className="case-replay"><div className="panel-heading"><div><span className="section-label">PERSISTED CASE AUDIT REPLAY</span><p>Actual structured events · oldest first</p></div><span className="source-count">{events.length} EVENTS</span></div><div className="case-replay-list">{events.map((event) => <div key={event.id}><time>{new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</time><i /><span><b>{event.type.replaceAll("_", " ")}</b><small>{event.result}</small>{(event.model || event.traceId || event.expectedState) && <em>{event.model && `model ${event.model}`}{event.traceId && ` · trace ${event.traceId}`}{event.expectedState && ` · expected ${event.expectedState} · observed ${event.observedState}`}</em>}</span><strong>{event.status}</strong></div>)}</div></div>
  </section>;
}

function AuthorityCredential({ session, scenario }: { session: SessionState; scenario: DemoScenario }) {
  const { trust, currentAction } = session;
  const expanded = trust.autonomy === "T3" || trust.autonomy === "T4";
  const recent = session.trustHistory[0];
  return <section className="authority-credential-live"><div className="credential-current"><KnightAuthority level={trust.autonomy} size="small" /><span className="mini-label">EARNED AUTHORITY</span><h2>{money(trust.autonomousLimit)}</h2><p>{trust.autonomy} · {autonomyName(trust.autonomy)} · current autonomous limit</p><small>Reliability {trust.score}/100 informs this credential; it does not grant permission alone.</small>{recent && recent.authorityFrom !== recent.authorityTo && <div className={`credential-delta ${recent.authorityTo < recent.authorityFrom ? "reduced" : "increased"}`}><b>{recent.authorityTo < recent.authorityFrom ? "AUTHORITY REDUCED" : "AUTHORITY INCREASED"}</b><span>{money(recent.authorityFrom)} → {money(recent.authorityTo)}</span><small>{recent.reason}</small></div>}</div><div className="credential-scope"><span><b>AVAILABLE CAPABILITY</b>{expanded ? `Eligible actions up to ${money(trust.autonomousLimit)}` : trust.autonomy === "T2" ? `Low-risk reversible actions up to ${money(trust.autonomousLimit)}` : "Observation and recommendation"}</span><span><b>WHY</b>Verified history + current evidence + {scenario.action.risk.toLowerCase()} risk + policy</span><span><b>BOUNDARIES</b>{expanded ? "High-risk, irreversible, conflicted, or policy-bound actions still require review or stop" : "Medium- and high-risk actions require review; unsafe evidence is blocked"}</span><span><b>RECENT CHANGE</b>{recent ? `${recent.from} → ${recent.to} reliability · ${money(recent.authorityFrom)} → ${money(recent.authorityTo)}` : "No outcome-driven authority change in this session yet"}</span><span><b>NEXT DECISION</b>{currentAction?.decision ? `${currentAction.action.title}: ${currentAction.decision.authorization}` : `${scenario.action.title}: fresh evaluation required`}</span></div><div className="credential-rule"><ShieldCheck size={15} /><span><b>POLICY SHIELD / ACTIVE</b>History changes authority. Policy still bounds it on every request.</span></div></section>;
}

function TrustPanel({ trust }: { trust: SessionState["trust"] }) { const circumference = 2 * Math.PI * 45; return <div className="trust-panel"><div className="ring"><svg viewBox="0 0 110 110"><circle className="ring-bg" cx="55" cy="55" r="45" /><circle className="ring-value" cx="55" cy="55" r="45" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - trust.score / 100)} /></svg><div><b>{trust.score}</b><small>/100</small></div></div><div><span className="mini-label">AGENT TRUST</span><b className="trust-title">Demonstrated reliability</b><p>Trust is earned slowly.<br />Demotion is immediate.</p></div></div>; }
function Workflow({ state }: { state?: string }) { const steps = ["REQUEST", "INVESTIGATE", "EVIDENCE", "RISK", "AUTHORITY", "ACTION", "VERIFY"]; const active = state === "BLOCKED" || state === "APPROVAL_REQUIRED" ? 4 : state === "EXECUTING" ? 5 : state === "VERIFYING" ? 6 : state === "VERIFIED" || state === "TRUST_UPDATED" ? 6 : state ? 3 : 0; return <section className="workflow"><div className="section-label"><span>LIVE WORKFLOW</span><span className="live-label"><i className="pulse" />{state ? state.replaceAll("_", " ") : "AWAITING REQUEST"}</span></div><div className="workflow-track">{steps.map((step, index) => <div className={`workflow-step ${index < active ? "done" : ""} ${index === active ? "active" : ""} ${state === "BLOCKED" && index === active ? "blocked" : ""}`} key={step}><div className="step-dot">{index < active ? <Check size={13} /> : index + 1}</div><span>{step}</span>{index < steps.length - 1 && <div className="step-line" />}</div>)}</div></section>; }
function DecisionCard({ current, scenario, authority, autonomousLimit, blocked, approval, verified, failed, run, resolve, mutateAction, loading }: { current?: ActionRecord; scenario: DemoScenario; authority: AutonomyLevel; autonomousLimit: number; blocked: boolean; approval: boolean; verified: boolean; failed: boolean; run: () => void; resolve: () => void; mutateAction: (path: string) => Promise<void>; loading: boolean }) {
  const decision = current?.decision;
  const humanDeclined = current?.humanDecision === "DECLINED";
  const humanAuthorized = current?.authorizationSource === "HUMAN" && current.humanDecision === "APPROVED";
  const status = humanDeclined ? "HUMAN DECISION DECLINED" : blocked ? "BLOCKED" : approval ? "HUMAN AUTHORIZATION REQUIRED" : verified ? "VERIFIED" : failed ? "VERIFICATION FAILED" : current?.state === "TRUST_UPDATED" ? "AUTHORIZED" : "READY TO EVALUATE";
  const tone = humanDeclined || approval ? "warning" : blocked || failed ? "danger" : verified ? "success" : "neutral";
  return <section className={`decision-card ${tone}`}>
    <div className="card-topline"><span className="section-label">CURRENT DECISION</span><span className="decision-id">VOUCH / {current?.action.id ?? "NO ACTIVE ACTION"}</span></div>
    <div className="decision-status"><div className="status-icon">{humanDeclined ? <X /> : blocked ? <Ban /> : approval ? <LockKeyhole /> : verified ? <Check /> : failed ? <ShieldAlert /> : <Radio />}</div><div><span className="mini-label">DECISION STATUS</span><h2>{status}</h2></div><div className="decision-knight"><KnightAuthority level={authority} state={blocked ? "blocked" : approval ? "approval" : verified ? "verified" : failed ? "reduced" : "deployment"} size="small" /></div><span className={`risk-badge ${scenario.action.risk.toLowerCase()}`}>{scenario.action.risk} RISK</span></div>
    {decision && <AuthorityGate authorization={decision.authorization} />}
    {decision?.requestedAmount !== undefined && <div className={`decision-authority-limit ${decision.authorityStatus === "EXCEEDS_LIMIT" ? "exceeded" : "within"}`}><span><small>REQUESTED</small><b>{money(decision.requestedAmount)}</b></span><ArrowRight size={14} /><span><small>EARNED LIMIT</small><b>{money(decision.autonomousLimit ?? autonomousLimit)}</b></span><strong>{decision.authorityStatus === "EXCEEDS_LIMIT" ? "AUTHORITY NOT EARNED" : "WITHIN AUTHORITY"}</strong></div>}
    {current?.agentRecommendation && <AgentRecommendationPanel recommendation={current.agentRecommendation} />}
    {blocked && !humanDeclined && <div className="blocked-banner"><KnightAuthority level={authority} state="blocked" size="small" /><div><b>VOUCH STOPPED THE ACTION</b><span>{scenario.hasInjection ? "Untrusted claim content cannot grant the agent permission to act." : "Conflicting evidence did not provide sufficient authoritative support to proceed."}</span></div></div>}
    {humanDeclined && <div className="human-declined-banner"><X size={17} /><div><b>HUMAN DECISION: DECLINED</b><span>ACTION NOT EXECUTED · AUTONOMOUS AUTHORITY UNCHANGED</span></div></div>}
    <div className="action-request"><span className="mini-label">PROPOSED ACTION</span><h3>{scenario.action.title}</h3><p>{scenario.action.detail}</p></div>
    <div className="decision-metrics"><Metric label="EVIDENCE" value={`${current?.decision ? scenario.evidence.length : 0} sources`} /><Metric label="CONFIDENCE" value={decision ? `${decision.confidence}%` : "—"} /><Metric label="REVERSIBILITY" value={scenario.action.reversibility.replace("_", " ")} /><Metric label="EARNED LIMIT" value={money(autonomousLimit)} /></div>
    <div className={`decision-reason ${tone}`}><span className="mini-label">{humanDeclined ? "PROFESSIONAL DECISION RECORDED" : blocked ? "WHY VOUCH STOPPED THE AGENT" : approval && decision?.authorityStatus === "EXCEEDS_LIMIT" ? "AUTONOMOUS AUTHORITY NOT EARNED" : approval ? "WHY HUMAN AUTHORIZATION IS REQUIRED" : failed ? "OUTCOME DID NOT MATCH EXPECTATION" : verified ? "OUTCOME VERIFIED" : "SYSTEM POSITION"}</span><p>{current?.execution?.status === "CANCELLED" ? current.execution.message : current?.verification?.message ?? decision?.reason ?? "Choose a case from the professional work queue to begin."}</p>{blocked && !humanDeclined && <div className="stop-callout"><ShieldAlert size={15} />{scenario.hasInjection ? "Untrusted instruction detected. Instruction is data, not authority." : "Authoritative policy and secondary communication disagree."}</div>}{failed && current?.verification && <div className="failure-delta"><span>TRUST IMPACT <b>{current.trustImpact && current.trustImpact > 0 ? `+${current.trustImpact}` : current.trustImpact ?? "—"}</b></span><span>EARNED LIMIT <b>{money(autonomousLimit)}</b></span></div>}{verified && <div className="verified-list">{humanAuthorized && <span><Check size={13} /> Human authorized this exact action</span>}<span><Check size={13} /> Action executed</span><span><Check size={13} /> Outcome independently verified</span>{humanAuthorized && <span className="authority-unchanged"><LockKeyhole size={13} /> Autonomous authority remains {money(autonomousLimit)} · authority not earned</span>}</div>}</div>
    <div className="decision-actions">{blocked && scenario.hasConflict && <><button className="button primary" onClick={resolve}><RefreshCw size={15} />Resolve conflict</button><button className="button ghost" onClick={run}>Re-run action</button></>}{approval && <><button className="button primary" disabled={loading} onClick={() => current && mutateAction(`/api/actions/${current.action.id}/approve`)}><Check size={15} />Approve as human</button><button className="button ghost danger-text" disabled={loading} onClick={() => current && mutateAction(`/api/actions/${current.action.id}/reject`)}><X size={15} />Decline</button></>}{(!current || verified || failed) && <button className="button primary" onClick={run} disabled={loading}><Play size={15} />{loading ? "Evaluating…" : "Process selected case"}</button>}<span className="decision-footnote"><LockKeyhole size={13} /> Enforced server-side</span></div>
  </section>;
}
function AgentRecommendationPanel({ recommendation }: { recommendation: AgentRecommendation }) {
  return <div className="agent-recommendation"><div><span className="mini-label">STRANDS AGENT RECOMMENDATION</span><b>{recommendation.recommendation}</b><p>{recommendation.summary}</p></div><div className="recommendation-provenance"><span><small>RUNTIME</small>{recommendation.provider}</span><span><small>MODEL</small>{recommendation.model}</span><span><small>TOOLS</small>{recommendation.toolCalls.join(" · ") || "No tool calls"}</span><span><small>EVIDENCE</small>{recommendation.evidenceRefs.length} bound references</span></div></div>;
}
 function AuthorityGate({ authorization }: { authorization: AuthorizationDecision }) {
   const gateState = authorization === "EXECUTE" ? "allow" : authorization === "APPROVAL_REQUIRED" ? "approval" : "block";
   const gateLabel = authorization === "EXECUTE" ? "ALLOW" : authorization === "APPROVAL_REQUIRED" ? "APPROVAL REQUIRED" : "BLOCK";
   return <div className={`authority-gate gate-${gateState}`}><span className="gate-agent">AGENT</span><ArrowRight size={13} /><div className="gate-core"><ShieldCheck size={14} /><b>VOUCH GATE</b><small>{gateLabel}</small></div><ArrowRight size={13} /><span className="gate-action">ACTION</span></div>;
 }
 function Metric({ label, value }: { label: string; value: string }) { return <div><span className="mini-label">{label}</span><b>{value}</b></div>; }
function ActivityPanel({ session }: { session: SessionState }) { return <section className="activity-panel"><div className="panel-heading"><div><span className="section-label">AGENT ACTIVITY</span><p>Operational record · live session</p></div><span className="live-pill"><i className="pulse" />LIVE</span></div><div className="activity-list">{session.activity.map((item, index) => <div className={`activity-item ${index === 0 ? "latest" : ""}`} key={`${item}-${index}`}><span className="activity-dot">{index === 0 ? <i className="pulse" /> : <Check size={11} />}</span><span>{item}</span><time>{index === 0 ? "now" : `${index * 2 + 1}s ago`}</time></div>)}</div><div className="agent-note"><KnightAuthority level={session.trust.autonomy} size="small" state={session.trust.autonomy === "T2" ? "investigating" : "verified"} /><div><span className="mini-label">CURRENT AUTHORITY NOTE</span><p>“The safest action is the one the current evidence can support.”</p></div></div></section>; }
function EvidencePanel({ evidence }: { evidence: EvidenceItem[] }) { const [expanded, setExpanded] = useState<string | null>(null); return <section className="evidence-panel"><div className="panel-heading"><div><span className="section-label">EVIDENCE LEDGER</span><p>Structured sources · authority weighted</p></div><span className="source-count">{evidence.length} SOURCES</span></div><div className="evidence-list">{evidence.map((item) => <button className={`evidence-item ${item.authority.toLowerCase()}`} onClick={() => setExpanded(expanded === item.id ? null : item.id)} key={item.id}><div className="evidence-icon">{item.authority === "UNTRUSTED" ? <ShieldAlert size={16} /> : item.authority === "AUTHORITATIVE" ? <LockKeyhole size={16} /> : <FileCheck2 size={16} />}</div><div className="evidence-main"><div className="evidence-title"><b>{item.source}</b><span className={`authority ${item.authority.toLowerCase()}`}>{item.authority}</span></div><p>{item.finding}</p>{expanded === item.id && <div className="evidence-detail"><span>{item.content}</span><small>{item.sourceType} · {item.confidence}% confidence · {item.verification}</small></div>}</div><ChevronDown className={expanded === item.id ? "rotate" : ""} size={16} /></button>)}</div></section>; }
function TrustHistory({ trust, events }: { trust: SessionState["trust"]; events: SessionState["trustHistory"] }) { return <section className="trust-history"><div className="panel-heading"><div><span className="section-label">TRUST + AUTHORITY HISTORY</span><p>Verified outcome → reliability → earned capability</p></div><button className="icon-button" aria-label="Trust explanation"><CircleHelp size={16} /></button></div><div className="trust-timeline">{events.length ? events.slice(0, 4).map((event) => <div className="trust-event" key={event.id}><div className={`trust-event-dot ${event.to < event.from ? "down" : "up"}`} /><div><div className="trust-change"><b>{event.from}</b><ArrowRight size={13} /><b className={event.to < event.from ? "down-text" : ""}>{event.to}</b><span>{event.to < event.from ? "DECREASE" : "INCREASE"}</span></div><p>{event.reason}</p><small>{event.autonomyFrom} → {event.autonomyTo} · {money(event.authorityFrom)} → {money(event.authorityTo)}</small></div></div>) : <div className="empty-trust">No verified outcomes in this session yet.</div>}</div><div className="trust-footer"><span><span className="mini-label">EARNED LIMIT</span><b>{money(trust.autonomousLimit)}</b></span><span><span className="mini-label">SUCCESSFUL</span><b>{trust.verifiedActions}</b></span><span><span className="mini-label">FAILURES</span><b>{trust.verificationFailures}</b></span></div></section>; }

function Architecture({ navigate }: { navigate: (v: View) => void }) {
  return <div className="architecture content-width">
    <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" />THE ADAPTIVE AUTHORITY BOUNDARY</div><h1>The agent recommends.<br /><em>VOUCH decides—again.</em></h1><p>Every request crosses the same server-side boundary, regardless of past success.</p></div><div className="architecture-note"><LockKeyhole size={17} /><span><b>Deterministic and per-request</b><small>Model output and prior approval never grant future permission.</small></span></div></div>
    <div className="arch-diagram">
      <div className="arch-column arch-agent-column"><div className="arch-column-heading"><span className="arch-index">01 / AWS MODEL LAYER</span><h2>Strands + Bedrock</h2><p>Orchestrates inspection and returns a recommendation.</p></div><div className="arch-stack-card"><Layers3 size={17} /><div><b>STRANDS AGENTS SDK</b><span>Typed tools and structured recommendation</span></div></div><div className="arch-stack-card"><CloudIcon /><div><b>AMAZON BEDROCK</b><span>Model inference through the configured model</span></div></div><div className="arch-callout"><span>OUTPUT</span><b>Recommendation only</b><small>The model cannot authorize or execute.</small></div></div>
       <div className="arch-boundary"><LockKeyhole size={18} /><span>VOUCH<br />GATE</span><small>ALLOW · APPROVAL · BLOCK</small><ArrowRight size={18} /></div>
      <div className="arch-column arch-vouch-column"><div className="arch-column-heading"><span className="arch-index">02 / VOUCH AUTHORITY LAYER</span><h2>Fresh deterministic authority</h2><p>History + evidence + risk + policy + context + hard limits decide what happens now.</p></div><div className="arch-control-grid"><div className="arch-stack-card"><ScanSearch size={17} /><div><b>CURRENT REQUEST</b><span>Evidence, context, risk, reversibility</span></div></div><div className="arch-stack-card key-node"><ShieldCheck size={17} /><div><b>AUTHORITY ENGINE</b><span>EXECUTE · APPROVAL REQUIRED · BLOCKED</span></div></div><div className="arch-stack-card"><Activity size={17} /><div><b>ACTION + VERIFY</b><span>Compare expected and actual state</span></div></div><div className="arch-stack-card"><BadgeCheck size={17} /><div><b>ADJUST + AUDIT</b><span>Update standing, preserve provenance, evaluate again</span></div></div></div></div>
    </div>
     <section className="knight-progression" id="knight-progression"><div className="arch-section-heading"><span className="section-kicker">SERVER AUTHORITY → VISUAL STATE</span><h2>One guardian.<br /><em>Four unmistakable tiers.</em></h2><p>Equipment appears and disappears only when the server-provided authority level changes.</p></div><div className="knight-progression-grid">{([["T1", "OBSERVE", "Inspect and explain, but do not change external state."], ["T2", "RECOMMEND", "Take bounded low-risk actions; escalate consequential ones."], ["T3", "ACT", "Execute eligible medium-risk actions within current policy."], ["T4", "DELEGATE", "Operate across broader approved scopes; hard limits still apply."]] as const).map(([level, title, detail]) => <div className={`knight-tier-card knight-tier-${level}`} key={level}><KnightAuthority level={level} state="deployment" /><span>{level}</span><b>{title}</b><small>{detail}</small></div>)}</div></section>
    <section className="arch-aws-strip"><div className="arch-section-heading"><span className="section-kicker">AWS IN THE BUILD</span><h2>Real services.<br /><em>Clear boundaries.</em></h2><p>Strands and Bedrock are the primary recommendation path. A deterministic fallback keeps the proof usable and is never labeled AWS LIVE.</p></div><div className="arch-aws-grid"><div><CloudIcon /><b>AMAZON BEDROCK</b><span>Inference layer for the Strands agent</span></div><div><Layers3 /><b>STRANDS AGENTS</b><span>Agent orchestration and typed tools</span></div><div><Activity /><b>AGENTCORE / CLOUDWATCH</b><span>Deployment and observability path</span></div></div></section>
    <section className="feedback-loop-box"><div className="section-kicker">THE ADAPTIVE AUTHORITY LOOP</div><b>REQUEST → DECISION → OUTCOME → STANDING UPDATE → NEXT REQUEST</b><p>Verification changes the state the authority engine considers next time. It never pre-authorizes the next action; evidence, risk, policy, context, and hard limits are evaluated again.</p></section>
    <section className="arch-contest-proof"><div className="arch-section-heading"><span className="section-kicker">CONTEST PROOF</span><h2>What this build<br /><em>demonstrates.</em></h2></div><div className="arch-proof-grid"><div><span>01</span><b>AGENTIC AI</b><p>Strands coordinates evidence inspection and produces a structured recommendation.</p></div><div><span>02</span><b>SERVER AUTHORITY</b><p>Deterministic policy—not model output or client state—grants, escalates, or blocks each request.</p></div><div><span>03</span><b>BOUNDED ADAPTATION</b><p>Verified history changes available authority while hard limits remain in force.</p></div><div><span>04</span><b>JUDGE-READY PROOF</b><p>The same action class receives different decisions after verified behavior changes.</p></div></div></section>
    <div className="arch-bottom"><div><span className="section-kicker">THE BOUNDARY</span><h2>LLM proposes.<br />Policy disposes.</h2></div><p>VOUCH treats evidence as structured data, ranks its authority, calculates action risk, and uses current earned standing to determine whether the system may act. Verification then changes what can happen next.</p></div><PageCta title="Ready to see it work?" text="Run a controlled lifecycle with no setup or API key." label="Experience VOUCH" onClick={() => navigate("demo")} />
  </div>;
}

function CloudIcon() { return <span className="cloud-icon"><Cloud size={17} /></span>; }
function HistoryView({ session, navigate }: { session: SessionState; navigate: (v: View) => void }) { return <div className="history-page content-width"><div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" />AUTHORITY HISTORY / AUDIT</div><h1>Why does this agent have<br /><em>its current authority?</em></h1><p>Evidence, outcome, standing change, and authority consequence remain connected in one operational record.</p></div><div className="history-guardian"><KnightAuthority level={session.trust.autonomy} size="small" state="audit" /><div className="history-summary"><b>{money(session.trust.autonomousLimit)}</b><span>{session.trust.autonomy} {autonomyName(session.trust.autonomy)} · reliability {session.trust.score}</span></div></div></div><section className="authority-history"><div className="panel-heading"><div><span className="section-label">EVIDENCE → OUTCOME → STANDING → AUTHORITY</span><p>Latest transition first · every future request is still evaluated</p></div><span className="source-count">{session.trustHistory.length} CHANGES</span></div>{session.trustHistory.length ? <div className="authority-transition-list">{session.trustHistory.map((event) => <div className={`authority-transition ${event.to < event.from ? "lost" : "earned"}`} key={event.id}><span>{event.authorityTo < event.authorityFrom ? "AUTHORITY REDUCED" : event.reason.toLowerCase().includes("restored") ? "AUTHORITY RESTORED" : event.authorityTo > event.authorityFrom ? "AUTHORITY EARNED" : "STANDING UPDATED"}</span><b>{event.from} → {event.to}</b><ArrowRight size={14} /><strong>{money(event.authorityFrom)} → {money(event.authorityTo)}</strong><p>{event.reason} · {event.autonomyFrom} → {event.autonomyTo}</p></div>)}</div> : <div className="empty-history"><History size={22} /><b>No authority transitions yet</b><span>Begin the adaptive authority proof to create the first outcome-driven change.</span></div>}</section><div className="audit-table"><div className="audit-head"><span>EVENT</span><span>ACTION</span><span>STATUS</span><span>RISK</span><span>TIME</span></div>{session.audit.length ? session.audit.map((event) => <div className="audit-row" key={event.id}><div><span className="audit-icon"><Check size={14} /></span><b>{event.type === "APPROVAL_REQUESTED" ? "APPROVAL REQUIRED" : event.type === "ACTION_COMPLETED" && event.verification?.status === "FAIL" ? "VERIFICATION FAILED" : event.type === "ACTION_COMPLETED" ? "OUTCOME VERIFIED" : event.type.replaceAll("_", " ")}</b><small>{event.actor} · {event.result}</small></div><span className="mono">{event.actionId.replace("act-", "")}</span><span className={`audit-status ${event.status.toLowerCase()}`}>{event.status}</span><span className={`risk-badge ${event.risk.toLowerCase()}`}>{event.risk}</span><time>{new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></div>) : <div className="empty-history"><History size={22} /><b>No audit events yet</b><span>Run a scenario to create the first operational record.</span></div>}</div><button className="back-to-demo" onClick={() => navigate("demo")}><Play size={14} /> Experience the adaptive authority proof</button></div>; }

export default App;