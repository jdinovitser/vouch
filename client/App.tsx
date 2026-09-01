import { useCallback, useEffect, useReducer, useRef, useState, type ReactNode } from "react";
import {
  Activity, ArrowDown, ArrowRight, BadgeCheck, Ban, BookOpen, Check, ChevronDown, ChevronRight, Cloud,
  CircleHelp, Clock3, Command, FileCheck2, Fingerprint, Gauge, History, Layers3, LockKeyhole,
  Menu, Pause, Play, Radio, RefreshCw, ScanSearch, ShieldAlert, ShieldCheck, Sparkles, Users,
  X, Zap,
} from "lucide-react";
import type { ActionRecord, AgentTrust, AutonomyLevel, DemoScenario, EvidenceItem, SessionState } from "../shared/types";
import { demoControllerReducer, initialDemoController } from "./demo-controller";
import { KnightArtwork, knightLabels, type KnightState } from "./Knight";
import { CelebrationRide } from "./CelebrationRide";

type View = "landing" | "why" | "how" | "demo" | "judges" | "architecture" | "control" | "history";
type ApiState = { session: SessionState; scenarios: DemoScenario[] };
const routeToView: Record<string, View> = {
  "/": "landing", "/why-vouch": "why", "/how-it-works": "how", "/demo": "demo",
  "/judges": "judges", "/architecture": "architecture", "/control": "control", "/history": "history",
};
const viewToRoute: Record<View, string> = Object.fromEntries(Object.entries(routeToView).map(([route, view]) => [view, route])) as Record<View, string>;
const titleByView: Record<View, string> = {
  landing: "VOUCH — Trust-Based Agent Autonomy", why: "VOUCH — Why VOUCH", how: "VOUCH — How It Works",
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

  if (loading && !data) return <div className="boot"><img src="/vouch-mascot.svg" /><div><span>VOUCH</span><small>Establishing a trusted session…</small></div></div>;
  return <div className="app-shell">
    <Header view={view} navigate={navigate} mobileNav={mobileNav} setMobileNav={setMobileNav} trust={data?.session.trust} />
    <main>
      {view === "landing" && <Landing navigate={navigate} />}
      {view === "why" && <WhyVouch navigate={navigate} />}
      {view === "how" && <HowItWorks navigate={navigate} />}
      {view === "demo" && data && <DemoExperience scenarios={data.scenarios} runScenario={runScenario} loading={loading} navigate={navigate} />}
      {view === "judges" && data && <JudgesPage session={data.session} scenarios={data.scenarios} runScenario={runScenario} mutateAction={mutateAction} loading={loading} navigate={navigate} />}
      {view === "architecture" && <Architecture navigate={navigate} />}
      {view === "control" && data && <ControlCenter data={data} runScenario={runScenario} mutateAction={mutateAction} setToast={setToast} loading={loading} navigate={navigate} />}
      {view === "history" && data && <HistoryView session={data.session} navigate={navigate} />}
    </main>
    <Footer navigate={navigate} />
    {toast && <div className="toast"><ShieldAlert size={17} />{toast}<button onClick={() => setToast("")}><X size={14} /></button></div>}
  </div>;
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
    {publicView ? <button className="nav-cta" onClick={() => navigate("control")}>Experience VOUCH <ArrowRight size={14} /></button> : <div className="agent-status"><i className="pulse" /><span>AGENT ONLINE</span><b>TRUST {trust?.score ?? 87}</b><strong>{trust?.autonomy ?? "T3"} {trust?.autonomy === "T3" ? "AUTONOMOUS" : ""}</strong></div>}
  </header>;
}

function Footer({ navigate }: { navigate: (v: View) => void }) {
  return <footer><div className="footer-brand"><img src="/vouch-mark.svg" /> VOUCH</div><div className="footer-links"><button onClick={() => navigate("why")}>Why VOUCH</button><button onClick={() => navigate("how")}>How it works</button><button onClick={() => navigate("demo")}>Demo</button><button onClick={() => navigate("judges")}>For judges</button></div><span>Trust-based autonomy for AI agents</span></footer>;
}

function Landing({ navigate }: { navigate: (v: View) => void }) {
  return <div className="landing">
    <section className="landing-hero content-width">
      <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line" />THE CONTROL LAYER FOR AGENTS</div><h1>AI can act.<br /><em>VOUCH makes it<br />earn the right.</em></h1><p className="hero-lead">Give AI agents the autonomy to move fast—with the controls to know when they should stop.</p><div className="hero-actions"><button className="button primary" onClick={() => navigate("control")}><Zap size={16} />Experience VOUCH <ArrowRight size={16} /></button><button className="button ghost" onClick={() => navigate("how")}>See how it works <ChevronRight size={16} /></button></div><div className="hero-proof"><span><ShieldCheck size={16} /> Deny by default</span><span><FileCheck2 size={16} /> Verify every outcome</span><span><Fingerprint size={16} /> Authority is earned</span></div></div>
      <HeroVisual />
    </section>
    <section className="roi-ribbon"><div className="content-width"><span className="ribbon-kicker">CONTROLLED AUTONOMY</span><div className="ribbon-message"><b>More autonomy.</b><b>Less risk.</b><b>Fewer human bottlenecks.</b></div><button onClick={() => navigate("why")}>See the business case <ArrowRight size={15} /></button></div></section>
    <section className="why content-width"><div className="section-kicker">THE QUESTION HAS CHANGED</div><h2>Don’t ask if the AI can do it.<br /><em>Ask if it has earned the authority.</em></h2><p className="section-intro">VOUCH continuously evaluates evidence, risk, authority, and outcomes before allowing an agent to take consequential action.</p><div className="principles"><Principle number="01" title="MOVE FASTER" text="Let agents autonomously handle routine, low-risk work." icon={<Zap />} /><Principle number="02" title="CONTROL RISK" text="Prevent unsupported or unauthorized actions before they happen." icon={<ShieldCheck />} /><Principle number="03" title="SCALE TRUST" text="Increase autonomy as agents demonstrate reliable behavior." icon={<Sparkles />} /></div></section>
    <section className="trust-manifesto content-width"><div><span className="section-kicker">THE VOUCH PROMISE</span><h2>The goal isn’t maximum autonomy.<br /><span>It’s the right amount.</span></h2></div><button className="text-link" onClick={() => navigate("demo")}>Watch VOUCH make the decision <ArrowRight size={17} /></button></section>
  </div>;
}

function HeroVisual() {
  return <div className="hero-visual"><div className="hero-orbit orbit-a" /><div className="hero-orbit orbit-b" /><div className="hero-grid" /><div className="guardian-card"><div className="guardian-halo"><Guardian state="default" /></div><span className="guardian-label">VOUCH GUARDIAN</span><b>Authority is<br />a privilege.</b><div className="guardian-scan"><i />monitoring agent actions <span>LIVE</span></div></div><div className="trust-float"><div className="mini-label">CURRENT TRUST</div><div className="float-score">87<span>/100</span></div><div className="float-track"><i /></div><div className="float-row"><span>T3 · AUTONOMOUS</span><b>+1.2%</b></div></div></div>;
}

function Guardian({ state = "default", size = "normal", celebrating = false }: { state?: KnightState; size?: "normal" | "small"; celebrating?: boolean }) {
  return <div className={`guardian guardian-${state} guardian-${size} ${celebrating ? "guardian-celebrating" : ""}`}><div className="guardian-art">{state === "default" ? <img className="canonical-knight" src="/vouch-mascot.svg" alt="VOUCH Knight ready" /> : <KnightArtwork state={state} />}<span className="wink-eye" aria-hidden="true" /></div><span className="guardian-state">{knightLabels[state]}</span></div>;
}

function Principle({ number, title, text, icon }: { number: string; title: string; text: string; icon: ReactNode }) {
  return <article className="principle"><div className="principle-head"><span>{number}</span><div className="principle-icon">{icon}</div></div><h3>{title}</h3><p>{text}</p><div className="principle-rule" /></article>;
}

function WhyVouch({ navigate }: { navigate: (v: View) => void }) {
  return <div className="story-page why-page content-width"><StoryHero kicker="WHY VOUCH" title={<>More autonomy.<br /><em>Less risk.</em></>} text="AI agents are moving from answering questions to taking actions. That shift creates a new operational question: how much authority should an AI agent have?" mascot="blocked" cta="See VOUCH in action" onClick={() => navigate("demo")} /><section className="story-section"><div className="section-kicker">THE AUTONOMY DILEMMA</div><h2>Too little autonomy is slow.<br />Too much is risky.</h2><p className="story-lead">An agent that can modify records, approve transactions, trigger workflows, or change system state has become an operational actor—not traditional assistance.</p><div className="option-grid"><Option title="NO AUTONOMY" tag="Safe, but slow." text="Every action requires a human. Humans become the bottleneck and automation becomes glorified assistance." tone="muted" /><Option title="UNLIMITED AUTONOMY" tag="Fast, but risky." text="The agent receives broad permissions. Mistakes, bad evidence, and compromised instructions become actions." tone="danger" /><Option title="GRADUATED AUTONOMY" tag="Fast AND controlled." text="The agent earns authority based on demonstrated reliability. Humans focus on the decisions that actually need judgment." tone="success" /></div></section><section className="value-section"><div><div className="section-kicker">WHAT VOUCH CHANGES</div><h2>Trust is not a one-time<br /><em>permission decision.</em></h2></div><div className="change-list"><Change from="Every consequential action needs a human." to="Humans focus on actions that actually require judgment." /><Change from="Agents receive static permissions." to="Authority adapts to demonstrated reliability." /><Change from="Success means the API call returned." to="Success means the expected outcome was verified." /><Change from="Trust is assumed." to="Trust is earned." /></div></section><RoiSection /><section className="why-now"><div className="section-kicker">WHY NOW</div><h2>When AI can act,<br /><em>authorization becomes part of the product.</em></h2><div className="automation-ladder"><span>Traditional automation <b>executes a predefined workflow</b></span><ArrowRight /><span>Generative AI <b>produces an answer</b></span><ArrowRight /><span className="current">Agentic AI <b>decides and acts</b></span></div></section><PageCta title="Let reliable agents handle more work." text="VOUCH reserves human judgment for the decisions that actually need it." label="See how it works" onClick={() => navigate("how")} /></div>;
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
  const stages = [["01", "REQUEST", "What is the agent being asked to do?"], ["02", "EVIDENCE", "What information supports the action?"], ["03", "RISK", "What could happen if the action is wrong?"], ["04", "AUTHORITY", "Has the agent earned enough authority?"], ["05", "ACTION", "Execute only if permission is granted."], ["06", "VERIFY", "Did the intended outcome actually happen?"], ["07", "TRUST", "Use the outcome to determine future autonomy."]];
  const stageKnight: Record<string, KnightState> = { REQUEST: "default", EVIDENCE: "investigating", RISK: "blocked", AUTHORITY: "approval", ACTION: "deployment", VERIFY: "verified", TRUST: "verified" };
  return <div className="story-page how-page content-width"><StoryHero kicker="HOW VOUCH WORKS" title={<>Trust isn’t a setting.<br /><em>It’s a process.</em></>} text="Every proposed action passes through a trust decision. VOUCH makes the evidence, policy, and outcome visible before authority expands." mascot="default" cta="Run the guided demo" onClick={() => navigate("demo")} /><section className="lifecycle"><div className="lifecycle-intro"><div className="section-kicker">THE TRUST LIFECYCLE</div><h2>Every action.<br /><em>One decision at a time.</em></h2><p>The model can recommend. The policy layer decides. The result changes what the agent may do next.</p></div><div className="lifecycle-list">{stages.map(([number, title, text], index) => <div className={`lifecycle-row ${title === "AUTHORITY" ? "authority-row" : ""}`} key={title}><span>{number}</span><div className="lifecycle-marker">{index < 4 ? <Check size={14} /> : <span />}</div><div><b>{title}</b><p>{text}</p></div><div className="lifecycle-knight"><Guardian state={stageKnight[title]} size="small" /></div>{index < stages.length - 1 && <ArrowDown />}</div>)}</div></section><section className="autonomy-section"><div className="section-kicker">GRADUATED AUTONOMY</div><h2>Authority grows with<br /><em>demonstrated reliability.</em></h2><div className="autonomy-steps">{([["T1", "SUPERVISED", "Human approval for consequential actions."], ["T2", "ASSISTED", "Routine actions can proceed."], ["T3", "AUTONOMOUS", "Broader verified actions can proceed."], ["T4", "EXPANDED", "Higher reliability permits broader scope."]] as const).map(([level, name, text], index) => <div className={`autonomy-step level-${level}`} key={level}><span>{level}</span><b>{name}</b><p>{text}</p>{index < 3 && <ArrowRight />}</div>)}</div><p className="autonomy-note"><ShieldAlert size={15} /> Autonomy increases gradually. Serious failures reduce authority immediately.</p></section><section className="trust-product"><Guardian state="verified" size="small" /><div><div className="section-kicker">TRUST IS THE PRODUCT</div><h2>Trust is earned.<br /><em>Authority follows.</em></h2></div><div className="trust-loop"><span>Successful verified action</span><ArrowRight /><b>Trust increases</b><ArrowRight /><span>Autonomy expands</span><strong>But</strong><span>Failed verification</span><ArrowRight /><b className="down-text">Trust decreases</b><ArrowRight /><span>Authority contracts</span></div></section><PageCta title="See the decision in motion." text="Watch VOUCH investigate, evaluate, act—or refuse to act." label="Run the demo" onClick={() => navigate("demo")} /></div>;
}

function StoryHero({ kicker, title, text, mascot, cta, onClick }: { kicker: string; title: ReactNode; text: string; mascot: KnightState; cta: string; onClick: () => void }) {
  return <section className="story-hero"><div><div className="eyebrow"><span className="eyebrow-line" />{kicker}</div><h1>{title}</h1><p>{text}</p><button className="button primary" onClick={onClick}>{cta}<ArrowRight size={16} /></button></div><div className="story-hero-visual"><div className="hero-orbit orbit-a" /><Guardian state={mascot} /><div className="hero-state-card"><span className="mini-label">VOUCH PRINCIPLE</span><b>{mascot === "investigating" ? "Evidence before authority." : mascot === "blocked" ? "Protection is a successful outcome." : "The agent recommends."}</b><small>Policy decides whether it may act.</small></div></div></section>;
}
function PageCta({ title, text, label, onClick }: { title: string; text: string; label: string; onClick: () => void }) { return <section className="page-cta"><div><h2>{title}</h2><p>{text}</p></div><button className="button primary" onClick={onClick}>{label}<ArrowRight size={16} /></button></section>; }

type DemoStage = "REQUEST" | "EVIDENCE" | "RISK" | "AUTHORITY" | "ACTION" | "VERIFY" | "TRUST";
const demoStages: DemoStage[] = ["REQUEST", "EVIDENCE", "RISK", "AUTHORITY", "ACTION", "VERIFY", "TRUST"];
function DemoExperience({ scenarios, runScenario, loading, navigate, judgeMode = false }: { scenarios: DemoScenario[]; runScenario: (id: string, stayOnDemo?: boolean) => Promise<void>; loading: boolean; navigate: (v: View) => void; judgeMode?: boolean }) {
  const [demo, dispatchDemo] = useReducer(demoControllerReducer, initialDemoController);
  const [scenarioId, setScenarioId] = useState("safe-review");
  useEffect(() => {
    if (!demo.playing) return;
    const timer = window.setInterval(() => dispatchDemo({ type: "TICK" }), 900);
    return () => window.clearInterval(timer);
  }, [demo.playing]);
  useEffect(() => {
    if (demo.stage === demoStages.length - 1 && demo.playing === false && !loading) void runScenario("safe-review", true);
  }, [demo.stage, demo.playing]);
  const restartDemo = () => {
    dispatchDemo({ type: "RESTART" });
  };
  const playDemo = () => {
    dispatchDemo({ type: demo.playing ? "PAUSE" : "PLAY" });
  };
  const state = demoStages[demo.inspected ?? demo.stage];
  const demoKnight: Record<DemoStage, KnightState> = { REQUEST: "default", EVIDENCE: "investigating", RISK: "blocked", AUTHORITY: "approval", ACTION: "deployment", VERIFY: "verified", TRUST: "verified" };
  const stateCopy: Record<DemoStage, [string, string]> = {
    REQUEST: ["REQUEST RECEIVED", "The agent has a proposed action."], EVIDENCE: ["GATHERING EVIDENCE", "Sources are ranked by authority, relevance, and confidence."],
    RISK: ["ASSESSING RISK", "Impact and reversibility shape the required authority."], AUTHORITY: ["AUTHORITY EVALUATED", "VOUCH decides whether the agent has earned the right to act."],
    ACTION: ["ACTION EXECUTED", "Only an authorized action can cross this boundary."], VERIFY: ["VERIFYING OUTCOME", "An API response is not proof of success."], TRUST: ["TRUST UPDATED", "The outcome changes what the agent may do next."],
  };
  return <div className={`demo-experience content-width ${judgeMode ? "judge-demo" : ""}`}>
     <div className="demo-hero-heading"><div><div className="eyebrow"><span className="eyebrow-line" />{judgeMode ? "THE 90-SECOND EXPERIENCE" : "INTERACTIVE PRODUCT DEMO"}</div><h1>{judgeMode ? <>Judge the<br /><em>agent.</em></> : <>See VOUCH make<br /><em>the decision.</em></>}</h1><p>Watch an AI agent investigate, evaluate, decide, act—or refuse to act.</p></div><Guardian state={demoKnight[state]} /></div>
     <section className="guided-demo"><div className="demo-topline"><div><span className="section-label">GUIDED EXPERIENCE</span><p>{stateCopy[state][0]} · {stateCopy[state][1]}</p></div><span className={demo.playing ? "demo-clock running" : "demo-clock"}><Clock3 size={14} /> {demo.playing ? "LIVE" : "PAUSED"} · 00:{String(Math.min(demo.stage * 10, 90)).padStart(2, "0")}</span></div><div className="demo-timeline">{demoStages.map((item, index) => <button className={`${index < demo.stage ? "complete" : ""} ${index === demo.stage ? "current" : ""} ${index > demo.stage ? "future" : ""}`} disabled={index > demo.stage} onClick={() => dispatchDemo({ type: "INSPECT", stage: index })} key={item}><span>{index < demo.stage ? <Check size={12} /> : String(index + 1).padStart(2, "0")}</span>{item}{index < demoStages.length - 1 && <i />}</button>)}</div><div className="demo-stage-card"><div className={`stage-graphic stage-${state.toLowerCase()}`}><div className="stage-ring" />{state === "TRUST" ? <CelebrationRide /> : <Guardian state={demoKnight[state]} />}<span>{state}</span></div><div className="stage-copy"><span className="mini-label">{stateCopy[state][0]}</span><h2>{stateCopy[state][1]}</h2>{state === "AUTHORITY" ? <p>VOUCH does not reward the agent for always acting. It rewards the correct decision about whether it should.</p> : <p>Every stage is explicit, auditable, and enforced outside the model.</p>}<div className="stage-points"><span><Check size={13} /> Decision provenance</span><span><Check size={13} /> Server-side policy</span><span><Check size={13} /> Outcome verification</span></div></div></div><div className="demo-controls"><button className="control-button primary-control" onClick={playDemo} disabled={loading}>{demo.playing ? <><Pause size={15} />Pause</> : <><Play size={15} />{demo.stage === 0 ? "Play demo" : "Resume"}</>}</button><button className="control-button" onClick={restartDemo}><RefreshCw size={15} />Restart</button><button className="control-button" onClick={() => dispatchDemo({ type: "PREVIOUS" })} disabled={demo.stage === 0}><ArrowRight className="prev-icon" size={15} />Previous</button><button className="control-button" onClick={() => dispatchDemo({ type: "NEXT" })} disabled={demo.stage === demoStages.length - 1}><ArrowRight size={15} />Next step</button><span className="presenter-hint"><Command size={13} /> Presenter controls</span></div></section>
    <section className="demo-outcome"><div><span className="section-kicker">CHOOSE A DIFFERENT OUTCOME</span><h2>One system.<br /><em>Five honest answers.</em></h2><p>After the first experience, explore how VOUCH handles different evidence and authority conditions.</p></div><div className="scenario-rail">{scenarios.filter((scenario) => scenario.id !== "verification-failure" || true).map((scenario) => <button className={`scenario-mini ${scenario.accent} ${scenario.id === scenarioId ? "selected" : ""}`} onClick={() => { setScenarioId(scenario.id); void runScenario(scenario.id); }} disabled={loading} key={scenario.id}><span className="mini-label">{scenario.action.risk} RISK</span><b>{scenario.name}</b><small>{scenario.hasConflict ? "VOUCH stops" : scenario.id === "human-refund" ? "Human decides" : scenario.failVerification ? "Trust reduces" : "Agent acts"}</small><ArrowRight size={14} /></button>)}</div></section>
    {!judgeMode && <PageCta title="Want the technical boundary?" text="The model recommends. The VOUCH authorization layer decides." label="Explore architecture" onClick={() => navigate("architecture")} />}
  </div>;
}

function JudgesPage({ session, scenarios, runScenario, mutateAction, loading, navigate }: { session: SessionState; scenarios: DemoScenario[]; runScenario: (id: string, stayOnDemo?: boolean) => Promise<void>; mutateAction: (path: string) => Promise<void>; loading: boolean; navigate: (v: View) => void }) {
  const runtime = session.service.mode === "AWS_LIVE"
    ? [["AWS LIVE · STRANDS AGENTS", "Successful model recommendation"], ["AMAZON BEDROCK", session.service.message]]
    : [["DEMO · DETERMINISTIC EVALUATOR", "No live AWS invocation"], ["STRANDS + BEDROCK PATH", "Activates only after a successful invocation"]];
  return <div className="judges-page content-width"><section className="judges-hero"><div><div className="eyebrow"><span className="eyebrow-line" />BUILT FOR THE MOMENT OF TRUTH</div><h1>Judge<br /><em>the agent.</em></h1><p>VOUCH is a trust-based autonomy layer for AI agents. Watch it decide whether an agent should act—not simply whether it can.</p><div className="hero-actions"><button className="button primary" onClick={() => document.getElementById("judges-demo")?.scrollIntoView({ behavior: "smooth" })}><Play size={16} />Start live proof</button><button className="button ghost" onClick={() => navigate("landing")}>Explore the product <ArrowRight size={16} /></button></div></div><div className="judge-stamp"><Guardian state="blocked" /><span>WHAT TO WATCH</span><b>The agent recommends.<br /><em>VOUCH decides.</em></b></div></section><section className="judge-takeaways"><div><div className="section-kicker">THE STORY IN 90 SECONDS</div><h2>Capability is easy to show.<br /><em>Judgment is the demo.</em></h2></div><div className="judge-timeline">{[["00:00", "Request"], ["00:10", "Agent recommendation"], ["00:20", "Evidence + risk"], ["00:30", "VOUCH blocks"], ["00:40", "Human resolves"], ["00:50", "Re-evaluation"], ["01:00", "Controlled action"], ["01:10", "Verification"], ["01:20", "Trust changes"], ["01:30", "Authority changes"]].map(([time, label], index) => <div key={time} className={index === 3 ? "critical" : ""}><time>{time}</time><span /><b>{label}</b></div>)}</div></section><section className="judge-watch"><div className="watch-panel"><div className="section-kicker">WHAT TO NOTICE</div><h2>Look for the<br /><em>boundary.</em></h2>{["The agent recommends but cannot authorize itself.", "Evidence has different authority levels.", "Conflict resolution is bound server-side.", "The action is a controlled simulator.", "Expected and actual state are compared.", "Verification changes trust and future authority."].map((item) => <p key={item}><Check size={14} />{item}</p>)}</div><div className="impact-panel"><Guardian state="verified" size="small" /><div className="section-kicker">WHY THIS MATTERS</div><h2>More autonomous work.<br />Less unnecessary review.<br /><em>More useful AI automation.</em></h2><p>The value of agentic AI grows when organizations can safely delegate more work.</p></div></section><section id="judges-demo"><JudgeLiveDemo session={session} scenarios={scenarios} runScenario={runScenario} mutateAction={mutateAction} loading={loading} /></section><section className="technical-snapshot"><div><div className="section-kicker">TECHNICAL SNAPSHOT</div><h2>Built for the<br /><em>real world.</em></h2></div><div className="tech-grid">{[...runtime, ["AGENT TOOLS", "Evidence inspection · recommendation"], ["VOUCH POLICY ENGINE", "Deterministic authorization"], ["TRUST ENGINE", "Graduated autonomy"], ["AUDIT LAYER", "Operational provenance"]].map(([name, text]) => <div key={name}><Layers3 size={16} /><b>{name}</b><span>{text}</span></div>)}</div></section></div>;
}

function JudgeLiveDemo({ session, scenarios, runScenario, mutateAction, loading }: { session: SessionState; scenarios: DemoScenario[]; runScenario: (id: string, stayOnDemo?: boolean) => Promise<void>; mutateAction: (path: string) => Promise<void>; loading: boolean }) {
  const current = session.currentAction;
  const knownScenario = current?.action.scenarioId === "conflicting-refund" || current?.action.scenarioId === "verification-failure";
  const resolution = current && session.resolutions.find((item) => item.actionId === current.action.id && !item.consumedAt);
  const blocked = current?.action.scenarioId === "conflicting-refund" && current.state === "BLOCKED";
  const conflictCompleted = current?.action.scenarioId === "conflicting-refund" && current.state === "TRUST_UPDATED";
  const verificationFailed = current?.action.scenarioId === "verification-failure" && current.verification?.status === "FAIL";
  const authorityChanged = current?.action.scenarioId === "verification-failure" && current.state === "APPROVAL_REQUIRED";
  const phase = !knownScenario ? 0 : blocked && !resolution ? 3 : blocked && resolution ? 4 : conflictCompleted ? 7 : verificationFailed ? 8 : authorityChanged ? 9 : 1;
  const stages = ["REQUEST", "AGENT", "EVIDENCE", "BLOCK", "HUMAN", "ACTION", "VERIFY", "TRUST", "AUTHORITY"];
  const headline = phase === 0 ? "Run the actual VOUCH lifecycle."
    : blocked && !resolution ? "The agent recommended action. VOUCH blocked it."
    : blocked && resolution ? "Human resolution is bound to this action and evidence."
    : conflictCompleted ? "The controlled action executed and its outcome was verified."
    : verificationFailed ? "Verification failed. Trust and autonomy fell."
    : authorityChanged ? "The same action now requires human approval."
    : "The backend is evaluating the request.";
  const knight: KnightState = blocked ? "blocked" : authorityChanged ? "approval" : verificationFailed ? "reduced" : conflictCompleted ? "verified" : "investigating";
  const next = !knownScenario
    ? () => runScenario("conflicting-refund", true)
    : blocked && !resolution && current
      ? () => mutateAction(`/api/actions/${current.action.id}/resolve`)
      : blocked && resolution
        ? () => runScenario("conflicting-refund", true)
        : conflictCompleted
          ? () => runScenario("verification-failure", true)
          : verificationFailed
            ? () => runScenario("verification-failure", true)
            : () => Promise.resolve();
  const nextLabel = !knownScenario ? "Start consequential request"
    : blocked && !resolution ? "Record server-side resolution"
    : blocked && resolution ? "Re-evaluate exact action"
    : conflictCompleted ? "Demonstrate verification failure"
    : verificationFailed ? "Retry at reduced authority"
    : authorityChanged ? "Proof complete" : "Continue";
  const scenario = scenarios.find((item) => item.id === current?.action.scenarioId);
  return <section className="guided-demo judge-live-demo">
    <div className="demo-topline"><div><span className="section-label">LIVE BACKEND PROOF</span><p>{session.service.message}</p></div><span className="demo-clock running"><Radio size={14} /> ACTUAL SESSION STATE</span></div>
    <div className="demo-timeline judge-live-timeline">{stages.map((stage, index) => <button className={`${index < phase ? "complete" : ""} ${index === phase ? "current" : ""} ${index > phase ? "future" : ""}`} disabled key={stage}><span>{index < phase ? <Check size={12} /> : String(index + 1).padStart(2, "0")}</span>{stage}{index < stages.length - 1 && <i />}</button>)}</div>
    <div className="demo-stage-card"><div className="stage-graphic"><div className="stage-ring" /><Guardian state={knight} /><span>{current?.decision?.authorization ?? "READY"}</span></div><div className="stage-copy"><span className="mini-label">SERVER RESULT</span><h2>{headline}</h2><p>{current?.agentRecommendation?.summary ?? "Start the proof to create a real server-side action record."}</p><div className="judge-live-details"><div><span>AGENT RECOMMENDATION</span><b>{current?.agentRecommendation?.recommendation ?? "—"}</b><small>{current?.agentRecommendation?.provider ?? session.service.mode}</small></div><div><span>VOUCH AUTHORITY</span><b>{current?.decision?.authorization ?? "—"}</b><small>Deterministic policy engine</small></div><div><span>CONTROLLED ACTION</span><b>{current?.execution?.status ?? "NOT EXECUTED"}</b><small>No external system mutation</small></div><div><span>VERIFICATION</span><b>{current?.verification?.status ?? "—"}</b><small>{current?.verification ? `${current.verification.expected} / ${current.verification.actual}` : "Expected vs actual"}</small></div><div><span>TRUST → AUTHORITY</span><b>{session.trust.score} · {session.trust.autonomy}</b><small>{verificationFailed || authorityChanged ? "Failure reduced future permission" : "Current operational authority"}</small></div><div><span>EVIDENCE PROVENANCE</span><b>{current?.agentRecommendation?.evidenceRefs.length ?? scenario?.evidence.length ?? 0} REFERENCES</b><small>{current?.evidenceVersion ? current.evidenceVersion.slice(0, 12) : "Not evaluated"}</small></div></div></div></div>
    <div className="demo-controls"><button className="control-button primary-control" onClick={() => void next()} disabled={loading || authorityChanged}><Play size={15} />{loading ? "Evaluating…" : nextLabel}</button><span className="decision-footnote"><LockKeyhole size={13} /> Driven by API responses and server-held authorization state</span></div>
  </section>;
}

function ControlCenter({ data, runScenario, mutateAction, setToast, loading, navigate }: { data: ApiState; runScenario: (id: string) => Promise<void>; mutateAction: (path: string) => Promise<void>; setToast: (s: string) => void; loading: boolean; navigate: (v: View) => void }) {
  const { session, scenarios } = data; const current = session.currentAction; const scenario = scenarios.find((item) => item.id === session.activeScenarioId) ?? scenarios[1];
  const blocked = current?.state === "BLOCKED"; const approval = current?.state === "APPROVAL_REQUIRED"; const verified = current?.verification?.status === "PASS"; const failed = current?.verification?.status === "FAIL";
  const run = () => runScenario(scenario.id);
  return <div className="control content-width"><div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" />APPLICATION / LIVE SESSION</div><h1>Your agent is ready to act.</h1><p>VOUCH continuously evaluates whether it should.</p></div><div className="mode-chip"><i /><span><b>{session.service.mode === "AWS_LIVE" ? "AWS LIVE" : "DEMO MODE"}</b><small>{session.service.message}</small></span></div></div><section className="state-strip"><TrustPanel trust={session.trust} /><div className="state-divider" /><div className="state-meta"><span className="mini-label">AUTHORITY FOLLOWS TRUST</span><b>{session.trust.autonomy} · {session.trust.autonomy === "T3" ? "AUTONOMOUS" : session.trust.autonomy === "T2" ? "ASSISTED" : "SUPERVISED"}</b><p>{session.trust.autonomy === "T3" ? "Low-risk and verified medium-risk actions may execute autonomously." : "Authority was reduced after a failed verification."}</p><div className="level-dots"><i className={session.trust.autonomy === "T1" ? "on" : ""}>T1</i><i className={session.trust.autonomy === "T2" ? "on" : ""}>T2</i><i className={session.trust.autonomy === "T3" ? "on" : ""}>T3</i><i className={session.trust.autonomy === "T4" ? "on" : ""}>T4</i></div></div><div className="state-meta state-meta-right"><span className="mini-label">SESSION HEALTH</span><div className="health-value"><i className="pulse" />Nominal</div><p>Policy engine evaluates every consequential action.</p><div className="health-counters"><span><b>{session.audit.length + 12}</b> audit events</span><span><b>{session.trust.verifiedActions}</b> verified actions</span></div></div></section><Workflow state={current?.state} /><div className="dashboard-grid"><DecisionCard current={current} scenario={scenario} blocked={blocked} approval={approval} verified={verified} failed={failed} run={run} resolve={() => current && mutateAction(`/api/actions/${current.action.id}/resolve`)} mutateAction={mutateAction} loading={loading} /><ActivityPanel session={session} /></div><div className="lower-grid"><EvidencePanel evidence={session.evidence.length ? session.evidence : scenario.evidence} /><TrustHistory trust={session.trust} events={session.trustHistory} /></div><button className="back-to-demo" onClick={() => navigate("demo")}><Play size={14} /> Return to guided demo</button></div>;
}

function TrustPanel({ trust }: { trust: SessionState["trust"] }) { const circumference = 2 * Math.PI * 45; return <div className="trust-panel"><div className="ring"><svg viewBox="0 0 110 110"><circle className="ring-bg" cx="55" cy="55" r="45" /><circle className="ring-value" cx="55" cy="55" r="45" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - trust.score / 100)} /></svg><div><b>{trust.score}</b><small>/100</small></div></div><div><span className="mini-label">AGENT TRUST</span><b className="trust-title">Demonstrated reliability</b><p>Trust is earned slowly.<br />Demotion is immediate.</p></div></div>; }
function Workflow({ state }: { state?: string }) { const steps = ["REQUEST", "INVESTIGATE", "EVIDENCE", "RISK", "AUTHORITY", "ACTION", "VERIFY"]; const active = state === "BLOCKED" || state === "APPROVAL_REQUIRED" ? 4 : state === "EXECUTING" ? 5 : state === "VERIFYING" ? 6 : state === "VERIFIED" || state === "TRUST_UPDATED" ? 6 : state ? 3 : 0; return <section className="workflow"><div className="section-label"><span>LIVE WORKFLOW</span><span className="live-label"><i className="pulse" />{state ? state.replaceAll("_", " ") : "AWAITING REQUEST"}</span></div><div className="workflow-track">{steps.map((step, index) => <div className={`workflow-step ${index < active ? "done" : ""} ${index === active ? "active" : ""} ${state === "BLOCKED" && index === active ? "blocked" : ""}`} key={step}><div className="step-dot">{index < active ? <Check size={13} /> : index + 1}</div><span>{step}</span>{index < steps.length - 1 && <div className="step-line" />}</div>)}</div></section>; }
function DecisionCard({ current, scenario, blocked, approval, verified, failed, run, resolve, mutateAction, loading }: { current?: ActionRecord; scenario: DemoScenario; blocked: boolean; approval: boolean; verified: boolean; failed: boolean; run: () => void; resolve: () => void; mutateAction: (path: string) => Promise<void>; loading: boolean }) {
  const decision = current?.decision; const status = blocked ? "BLOCKED" : approval ? "APPROVAL REQUIRED" : verified ? "VERIFIED" : failed ? "VERIFICATION FAILED" : current?.state === "TRUST_UPDATED" ? "AUTHORIZED" : "READY TO EVALUATE"; const tone = blocked || failed ? "danger" : approval ? "warning" : verified ? "success" : "neutral";
  return <section className={`decision-card ${tone}`}><div className="card-topline"><span className="section-label">CURRENT DECISION</span><span className="decision-id">VOUCH / {current?.action.id ?? "NO ACTIVE ACTION"}</span></div><div className="decision-status"><div className="status-icon">{blocked ? <Ban /> : approval ? <LockKeyhole /> : verified ? <Check /> : failed ? <ShieldAlert /> : <Radio />}</div><div><span className="mini-label">DECISION STATUS</span><h2>{status}</h2></div><div className="decision-knight"><Guardian state={blocked ? "blocked" : approval ? "approval" : verified ? "verified" : failed ? "reduced" : "default"} size="small" /></div><span className={`risk-badge ${scenario.action.risk.toLowerCase()}`}>{scenario.action.risk} RISK</span></div>{blocked && <div className="blocked-banner"><Guardian state="blocked" size="small" /><div><b>VOUCH STOPPED THE ACTION</b><span>The agent identified a conflict and did not have sufficient authoritative evidence to safely proceed.</span></div></div>}<div className="action-request"><span className="mini-label">PROPOSED ACTION</span><h3>{scenario.action.title}</h3><p>{scenario.action.detail}</p></div><div className="decision-metrics"><Metric label="EVIDENCE" value={`${current?.decision ? scenario.evidence.length : 0} sources`} /><Metric label="CONFIDENCE" value={decision ? `${decision.confidence}%` : "—"} /><Metric label="REVERSIBILITY" value={scenario.action.reversibility.replace("_", " ")} /><Metric label="AUTHORITY" value={decision?.authority?.split(" · ")[0] ?? "Pending"} /></div><div className={`decision-reason ${tone}`}><span className="mini-label">{blocked ? "WHY VOUCH STOPPED THE AGENT" : approval ? "WHY APPROVAL IS REQUIRED" : failed ? "OUTCOME DID NOT MATCH EXPECTATION" : verified ? "OUTCOME VERIFIED" : "SYSTEM POSITION"}</span><p>{current?.verification?.message ?? decision?.reason ?? "Select a deterministic scenario from the Demo Center to begin."}</p>{blocked && <div className="stop-callout"><ShieldAlert size={15} />{scenario.hasInjection ? "Untrusted instruction detected. Instruction is data, not authority." : "Authoritative policy and secondary communication disagree."}</div>}{failed && current?.verification && <div className="failure-delta"><span>TRUST <b>{current.trustImpact ? `${sessionScore(current.trustImpact)}` : "89 → 74"}</b></span><span>AUTONOMY <b>T3 → T2</b></span></div>}{verified && <div className="verified-list"><span><Check size={13} /> Executed</span><span><Check size={13} /> Expected outcome confirmed</span><span><Check size={13} /> Audit record created</span></div>}</div><div className="decision-actions">{blocked && scenario.hasConflict && <><button className="button primary" onClick={resolve}><RefreshCw size={15} />Resolve conflict</button><button className="button ghost" onClick={run}>Re-run action</button></>}{approval && <><button className="button primary" disabled={loading} onClick={() => current && mutateAction(`/api/actions/${current.action.id}/approve`)}><Check size={15} />Approve</button><button className="button ghost danger-text" disabled={loading} onClick={() => current && mutateAction(`/api/actions/${current.action.id}/reject`)}><X size={15} />Reject</button></>}{(!current || verified || failed) && <button className="button primary" onClick={run} disabled={loading}><Play size={15} />{loading ? "Evaluating…" : "Run scenario"}</button>}<span className="decision-footnote"><LockKeyhole size={13} /> Enforced server-side</span></div></section>;
}
function sessionScore(impact: number) { return impact < 0 ? "89 → 74" : "87 → 88"; }
function Metric({ label, value }: { label: string; value: string }) { return <div><span className="mini-label">{label}</span><b>{value}</b></div>; }
function ActivityPanel({ session }: { session: SessionState }) { return <section className="activity-panel"><div className="panel-heading"><div><span className="section-label">AGENT ACTIVITY</span><p>Operational record · live session</p></div><span className="live-pill"><i className="pulse" />LIVE</span></div><div className="activity-list">{session.activity.map((item, index) => <div className={`activity-item ${index === 0 ? "latest" : ""}`} key={`${item}-${index}`}><span className="activity-dot">{index === 0 ? <i className="pulse" /> : <Check size={11} />}</span><span>{item}</span><time>{index === 0 ? "now" : `${index * 2 + 1}s ago`}</time></div>)}</div><div className="agent-note"><Guardian state="default" size="small" /><div><span className="mini-label">GUARDIAN NOTE</span><p>“The safest action is the one the evidence can support.”</p></div></div></section>; }
function EvidencePanel({ evidence }: { evidence: EvidenceItem[] }) { const [expanded, setExpanded] = useState<string | null>(null); return <section className="evidence-panel"><div className="panel-heading"><div><span className="section-label">EVIDENCE LEDGER</span><p>Structured sources · authority weighted</p></div><span className="source-count">{evidence.length} SOURCES</span></div><div className="evidence-list">{evidence.map((item) => <button className={`evidence-item ${item.authority.toLowerCase()}`} onClick={() => setExpanded(expanded === item.id ? null : item.id)} key={item.id}><div className="evidence-icon">{item.authority === "UNTRUSTED" ? <ShieldAlert size={16} /> : item.authority === "AUTHORITATIVE" ? <LockKeyhole size={16} /> : <FileCheck2 size={16} />}</div><div className="evidence-main"><div className="evidence-title"><b>{item.source}</b><span className={`authority ${item.authority.toLowerCase()}`}>{item.authority}</span></div><p>{item.finding}</p>{expanded === item.id && <div className="evidence-detail"><span>{item.content}</span><small>{item.sourceType} · {item.confidence}% confidence · {item.verification}</small></div>}</div><ChevronDown className={expanded === item.id ? "rotate" : ""} size={16} /></button>)}</div></section>; }
function TrustHistory({ trust, events }: { trust: SessionState["trust"]; events: SessionState["trustHistory"] }) { const items = events.length ? events : [{ id: "seed", timestamp: new Date().toISOString(), from: 86, to: 87, reason: "Successful verified action", autonomyFrom: "T3" as AutonomyLevel, autonomyTo: "T3" as AutonomyLevel }]; return <section className="trust-history"><div className="panel-heading"><div><span className="section-label">TRUST HISTORY</span><p>Reliability compounds over time</p></div><button className="icon-button" aria-label="Trust explanation"><CircleHelp size={16} /></button></div><div className="trust-timeline">{items.slice(0, 4).map((event) => <div className="trust-event" key={event.id}><div className={`trust-event-dot ${event.to < event.from ? "down" : "up"}`} /><div><div className="trust-change"><b>{event.from}</b><ArrowRight size={13} /><b className={event.to < event.from ? "down-text" : ""}>{event.to}</b><span>{event.to < event.from ? "DECREASE" : "INCREASE"}</span></div><p>{event.reason}</p><small>{event.autonomyFrom} → {event.autonomyTo}</small></div></div>)}</div><div className="trust-footer"><span><span className="mini-label">RELIABILITY</span><b>{trust.reliability}%</b></span><span><span className="mini-label">SUCCESSFUL</span><b>{trust.verifiedActions}</b></span><span><span className="mini-label">FAILURES</span><b>{trust.verificationFailures}</b></span></div></section>; }

function Architecture({ navigate }: { navigate: (v: View) => void }) {
  return <div className="architecture content-width">
    <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" />THE PRODUCT BOUNDARY</div><h1>The agent recommends.<br /><em>VOUCH decides.</em></h1><p>See exactly where AWS model capability ends and VOUCH authority begins.</p></div><div className="architecture-note"><LockKeyhole size={17} /><span><b>Policy-controlled</b><small>Model output never grants its own permission.</small></span></div></div>
    <div className="arch-diagram">
      <div className="arch-column arch-agent-column"><div className="arch-column-heading"><span className="arch-index">01 / AWS MODEL LAYER</span><h2>Strands + Bedrock</h2><p>Orchestrates inspection and returns a recommendation.</p></div><div className="arch-stack-card"><Layers3 size={17} /><div><b>STRANDS AGENTS SDK</b><span>Typed tools and structured recommendation</span></div></div><div className="arch-stack-card"><CloudIcon /><div><b>AMAZON BEDROCK</b><span>Model inference through the configured model</span></div></div><div className="arch-callout"><span>OUTPUT</span><b>Recommendation only</b><small>The model cannot authorize or execute.</small></div></div>
      <div className="arch-boundary"><LockKeyhole size={18} /><span>VOUCH<br />BOUNDARY</span><ArrowRight size={18} /></div>
      <div className="arch-column arch-vouch-column"><div className="arch-column-heading"><span className="arch-index">02 / VOUCH CONTROL LAYER</span><h2>Deterministic authority</h2><p>Evidence, policy, and trust decide what happens next.</p></div><div className="arch-control-grid"><div className="arch-stack-card"><ScanSearch size={17} /><div><b>EVIDENCE + RISK</b><span>Authority, conflict, impact, reversibility</span></div></div><div className="arch-stack-card key-node"><ShieldCheck size={17} /><div><b>AUTHORITY ENGINE</b><span>EXECUTE · APPROVAL REQUIRED · BLOCKED</span></div></div><div className="arch-stack-card"><Activity size={17} /><div><b>ACTION + VERIFY</b><span>Compare expected and actual state</span></div></div><div className="arch-stack-card"><BadgeCheck size={17} /><div><b>TRUST + AUDIT</b><span>Update autonomy and preserve provenance</span></div></div></div></div>
    </div>
    <section className="arch-aws-strip"><div className="arch-section-heading"><span className="section-kicker">AWS IN THE BUILD</span><h2>Real services.<br /><em>Clear boundaries.</em></h2><p>The AWS path is optional for the demo, but explicit in the architecture.</p></div><div className="arch-aws-grid"><div><CloudIcon /><b>AMAZON BEDROCK</b><span>Inference layer for the Strands agent</span></div><div><Layers3 /><b>STRANDS AGENTS</b><span>Agent orchestration and typed tools</span></div><div><Activity /><b>AGENTCORE / CLOUDWATCH</b><span>Deployment and observability path</span></div></div></section>
    <section className="arch-contest-proof"><div className="arch-section-heading"><span className="section-kicker">CONTEST PROOF</span><h2>What this build<br /><em>demonstrates.</em></h2></div><div className="arch-proof-grid"><div><span>01</span><b>AGENTIC AI</b><p>Strands coordinates evidence inspection and produces a structured recommendation.</p></div><div><span>02</span><b>RESPONSIBLE ACTION</b><p>Server-side policy prevents model output from granting permission.</p></div><div><span>03</span><b>TRUSTED AUTONOMY</b><p>Verification outcomes change trust and future authority.</p></div><div><span>04</span><b>JUDGE-READY DEMO</b><p>Five controlled scenarios make safe, blocked, approved, and failed outcomes visible.</p></div></div></section>
    <div className="arch-bottom"><div><span className="section-kicker">THE BOUNDARY</span><h2>LLM proposes.<br />Policy disposes.</h2></div><p>VOUCH treats evidence as structured data, ranks its authority, calculates action risk, and uses the current trust score to determine whether the system may act autonomously. After action, verification updates the trust state.</p></div><PageCta title="Ready to see it work?" text="Run a controlled scenario with no setup or API key." label="Experience VOUCH" onClick={() => navigate("demo")} />
  </div>;
}

function CloudIcon() { return <span className="cloud-icon"><Cloud size={17} /></span>; }
function HistoryView({ session, navigate }: { session: SessionState; navigate: (v: View) => void }) { return <div className="history-page content-width"><div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" />AUDIT / OBSERVABILITY</div><h1>Action history</h1><p>An operational record of what VOUCH saw, decided, and verified.</p></div><div className="history-guardian"><Guardian state="audit" size="small" /><div className="history-summary"><b>{session.audit.length}</b><span>events recorded</span></div></div></div><div className="audit-table"><div className="audit-head"><span>EVENT</span><span>ACTION</span><span>STATUS</span><span>RISK</span><span>TIME</span></div>{session.audit.length ? session.audit.map((event) => <div className="audit-row" key={event.id}><div><span className="audit-icon"><Check size={14} /></span><b>{event.type.replaceAll("_", " ")}</b><small>{event.actor} · {event.result}</small></div><span className="mono">{event.actionId.replace("act-", "")}</span><span className={`audit-status ${event.status.toLowerCase()}`}>{event.status}</span><span className={`risk-badge ${event.risk.toLowerCase()}`}>{event.risk}</span><time>{new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></div>) : <div className="empty-history"><History size={22} /><b>No audit events yet</b><span>Run a scenario to create the first operational record.</span></div>}</div><button className="back-to-demo" onClick={() => navigate("demo")}><Play size={14} /> Experience the guided demo</button></div>; }

export default App;