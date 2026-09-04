import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  Activity, ArrowDown, ArrowRight, BadgeCheck, Ban, BookOpen, Bot, Check, ChevronDown, ChevronRight, Cloud,
  CircleHelp, Database, FileCheck2, Fingerprint, Gauge, History, Layers3, LockKeyhole,
  Menu, Play, Radio, RefreshCw, ScanSearch, ShieldAlert, ShieldCheck, Users,
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
  landing: "VOUCH — The AI That Looks Out for People", why: "VOUCH — Why People Need VOUCH", how: "VOUCH — How It Works",
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
  if (view !== "history") return null;
  return <div className="earned-banner"><span className="section-kicker">VOUCH / VERIFIED HISTORY</span><h2>Read every transition as evidence → outcome → authority. <em>This is the agent&apos;s operational memory.</em></h2></div>;
}

function Header({ view, navigate, mobileNav, setMobileNav, trust }: { view: View; navigate: (v: View) => void; mobileNav: boolean; setMobileNav: (v: boolean) => void; trust?: AgentTrust }) {
  const publicView = ["landing", "why", "how", "demo", "architecture", "judges"].includes(view);
  return <header className={`topbar ${publicView ? "public-nav" : "app-nav"}`}>
    <button className="brand" onClick={() => navigate("landing")} aria-label="VOUCH home"><img src="/vouch-mark.svg" /><span>VOUCH<small>AI teammate backup</small></span></button>
    <button className="mobile-menu" onClick={() => setMobileNav(!mobileNav)} aria-label="Toggle navigation"><Menu size={21} /></button>
    <nav className={mobileNav ? "nav open" : "nav"}>
      <button className={view === "landing" ? "active" : ""} onClick={() => navigate("landing")}>Home</button>
      <button className={view === "why" ? "active" : ""} onClick={() => navigate("why")}>Why VOUCH</button>
      <button className={view === "how" ? "active" : ""} onClick={() => navigate("how")}>How it works</button>
      <button className={view === "demo" ? "active" : ""} onClick={() => navigate("demo")}><Play size={14} />See it work</button>
      <button className={view === "architecture" ? "active" : ""} onClick={() => navigate("architecture")}>Architecture</button>
      {!publicView && <><button className={view === "control" ? "active" : ""} onClick={() => navigate("control")}><Gauge size={14} />Control center</button><button className={view === "history" ? "active" : ""} onClick={() => navigate("history")}><History size={14} />History</button></>}
    </nav>
    {publicView ? <button className="nav-cta" onClick={() => navigate("demo")}>See VOUCH in action <ArrowRight size={14} /></button> : <div className="agent-status"><i className="pulse" /><span>AGENT ONLINE</span><b>TRUST {trust?.score ?? 84}</b><strong>{trust?.autonomy ?? "T2"} · {autonomyName(trust?.autonomy ?? "T2")}</strong></div>}
  </header>;
}

function autonomyName(level: AutonomyLevel) {
  return level === "T1" ? "OBSERVE" : level === "T2" ? "RECOMMEND" : level === "T3" ? "ACT" : "DELEGATE";
}
const money = (amount: number) => `$${amount.toLocaleString()}`;

function Footer({ navigate }: { navigate: (v: View) => void }) {
  return <footer><div className="footer-brand"><img src="/vouch-mark.svg" /> VOUCH</div><div className="footer-links"><button onClick={() => navigate("why")}>Why VOUCH</button><button onClick={() => navigate("how")}>How it works</button><button onClick={() => navigate("demo")}>See it work</button><button onClick={() => navigate("judges")}>For judges</button></div><span>The AI that looks out for people</span></footer>;
}

function Landing({ navigate, trust }: { navigate: (v: View) => void; trust?: AgentTrust }) {
  return <div className="landing">
    <section className="landing-hero content-width">
      <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line" />A TRUSTED AI TEAMMATE FOR GROUPS HELPING THEIR COMMUNITIES</div><h1>The AI that<br /><em>looks out for people.</em></h1><p className="hero-lead">A Good Neighbor AI teammate that earns trust through proven work—so groups can spend more time helping people.</p><div className="earned-loop"><b>HELP</b><i /><b>PROVE</b><i /><b>VERIFY</b><i /><b>EARN</b></div><div className="hero-actions"><button className="button primary" onClick={() => navigate("demo")}><Zap size={16} />See VOUCH in action <ArrowRight size={16} /></button><button className="button ghost" onClick={() => navigate("how")}>How it works <ChevronRight size={16} /></button></div><div className="hero-proof"><span><ShieldCheck size={16} /> The agent starts small</span><span><Users size={16} /> The group decides what it has earned</span><span><Fingerprint size={16} /> Results are verified</span></div></div>
      <HeroVisual level={trust?.autonomy ?? "T2"} />
    </section>
    <TeamDelegation />
    <section className="roi-ribbon"><div className="content-width"><span className="ribbon-kicker">THE VOUCH PROMISE</span><div className="ribbon-message"><b>People need help.</b><b>AI can help.</b><b>VOUCH looks out for them.</b></div><button onClick={() => navigate("why")}>See how VOUCH helps <ArrowRight size={15} /></button></div></section>
    <section className="why content-width"><div className="section-kicker">WHY PEOPLE NEED A BACKUP</div><h2>AI should help people.<br /><em>Not leave them guessing.</em></h2><p className="section-intro">When an agent acts on someone’s behalf, VOUCH provides a trusted second set of eyes before anything important changes.</p><div className="principles"><Principle number="01" title="TRUST" text="Is this really what people intended?" icon={<CircleHelp />} /><Principle number="02" title="AUTHORITY" text="Is the agent allowed to do it?" icon={<LockKeyhole />} /><Principle number="03" title="RISK" text="What could happen if it gets it wrong?" icon={<ShieldAlert />} /><Principle number="04" title="VERIFY" text="Can we check what it is relying on?" icon={<FileCheck2 />} /></div></section>
    <CommunityCapacity navigate={navigate} />
    <TeammateRoles />
    <HumanControl navigate={navigate} />
    <section className="trust-manifesto content-width"><div><span className="section-kicker">TRUST WITH JUDGMENT</span><h2>Trust doesn’t mean<br /><span>never checking.</span></h2><p>A trusted teammate still knows when to ask for help. VOUCH keeps higher-stakes decisions with people instead of pretending every decision should be automated.</p></div><button className="text-link" onClick={() => navigate("demo")}>See the human decision <ArrowRight size={17} /></button></section>
  </div>;
}

function HeroVisual({ level }: { level: AutonomyLevel }) {
  const statusCopy = level === "T4" ? "Broad trust; hard limits remain." : level === "T3" ? "Proven within bounded work." : level === "T2" ? "Learning through verified outcomes." : "Starting with limited responsibility.";
  return <div className="hero-visual"><div className="hero-orbit orbit-a" /><div className="hero-orbit orbit-b" /><div className="hero-grid" /><div className="guardian-card authority-card"><div className="guardian-halo hero-warrior"><KnightAuthority level="T3" size="normal" /></div><span className="guardian-label">PROVEN TEAMMATE / T3</span><b>Proven work earns responsibility.</b><div className="guardian-scan"><i />verified example <span>T3 · ACT</span></div></div><div className="trust-float"><div className="mini-label">CURRENT RESPONSIBILITY</div><div className="float-score">{level}<span> · {autonomyName(level)}</span></div><div className="float-track"><i style={{ width: `${level === "T1" ? 25 : level === "T2" ? 50 : level === "T3" ? 75 : 100}%` }} /></div><div className="float-row"><span>{statusCopy}</span><b>EARNED</b></div></div></div>;
}

function Guardian({ state = "default", size = "normal", celebrating = false }: { state?: KnightState; size?: "normal" | "small"; celebrating?: boolean }) {
  return <div className={`guardian guardian-${state} guardian-${size} ${celebrating ? "guardian-celebrating" : ""}`}><div className="guardian-art">{state === "default" ? <img className="canonical-knight" src="/vouch-mascot.svg" alt="VOUCH Knight ready" /> : <KnightArtwork state={state} />}<span className="wink-eye" aria-hidden="true" /></div><span className="guardian-state">{knightLabels[state]}</span></div>;
}

function Principle({ number, title, text, icon }: { number: string; title: string; text: string; icon: ReactNode }) {
  return <article className="principle"><div className="principle-head"><span>{number}</span><div className="principle-icon">{icon}</div></div><h3>{title}</h3><p>{text}</p><div className="principle-rule" /></article>;
}

function TeamDelegation() {
  const steps = [
    ["START SMALL", "The agent begins with limited responsibility."],
    ["PROVE IT", "The agent handles real work."],
    ["VERIFY", "The result is independently checked."],
    ["EARN TRUST", "Successful work provides evidence that the agent can handle more."],
    ["TAKE ON MORE", "The agent can responsibly handle additional work."],
    ["STEP IN WHEN IT MATTERS", "When the stakes are higher, the group makes the decision."],
  ];
  return <section className="team-delegation content-width"><div className="delegation-copy"><div className="section-kicker">HELP MORE PEOPLE WITH THE PEOPLE YOU HAVE</div><h2>Trust is<br /><em>earned.</em></h2><p>Community teams are often asked to do more with limited time and limited hands. An AI teammate can help take on routine work—but the group needs a way to know when that teammate has earned more responsibility.</p><strong>VOUCH turns successful, verified work into earned trust.</strong></div><div className="delegation-steps">{steps.map(([title, text], index) => <div key={title}><span>0{index + 1}</span><b>{title}</b><p>{text}</p>{index < steps.length - 1 && <ArrowDown size={15} />}</div>)}</div></section>;
}

function CommunityCapacity({ navigate }: { navigate: (v: View) => void }) {
  const groups = [
    ["NEIGHBORHOOD TEAMS", "Help more neighbors.", "Take routine coordination off people's plates."],
    ["FOOD PANTRY TEAMS", "Give volunteers more time to serve.", "Let AI handle repetitive administrative work."],
    ["SCHOOL + LIBRARY TEAMS", "Make the busywork lighter.", "Give small teams help without handing over important judgment."],
    ["SMALL LOCAL ORGANIZATIONS", "Add another set of hands.", "More capacity without blind trust."],
  ];
  return <section className="community-capacity content-width"><div className="community-heading"><div className="section-kicker">A GOOD NEIGHBOR AGENT</div><h2>Give community teams<br /><em>another set of hands.</em></h2><p>A small team should not have to choose between helping more people and protecting the time of the people doing the work. A trusted AI teammate can take on routine work while people stay focused on the relationships, judgment, and decisions only people should make.</p><button className="text-link" onClick={() => navigate("how")}>See how trust is earned <ArrowRight size={17} /></button><small>Illustrative use cases—not current customer or deployment claims.</small></div><div className="community-grid">{groups.map(([title, headline, text], index) => <article key={title}><span>0{index + 1}</span><b>{title}</b><h3>{headline}</h3><p>{text}</p></article>)}</div></section>;
}

function TeammateRoles() {
  return <section className="teammate-roles content-width"><div className="section-kicker">THE THREE ROLES</div><h2>Three roles. One shared goal:<br /><em>help people.</em></h2><p className="roles-intro">VOUCH makes trust the relationship between the group and its AI teammate.</p><div className="roles-grid"><article><Users size={24} /><span>THE GROUP</span><h3>Decides responsibility.</h3><p>Sets the boundaries and decides what responsibility the AI should have.</p></article><article><Bot size={24} /><span>THE AI TEAMMATE</span><h3>Proves what it can do.</h3><p>Handles work, gathers evidence, reasons about requests, and creates a track record.</p></article><article className="vouch-role"><ShieldCheck size={24} /><span>VOUCH</span><h3>Turns proof into trust.</h3><p>Uses evidence, verification, risk, and outcomes to support trustworthy delegation.</p></article></div><strong>The agent earns responsibility through what it proves.</strong></section>;
}

function HumanControl({ navigate }: { navigate: (v: View) => void }) {
  return <section className="human-control content-width"><div><div className="section-kicker">TRUST WITH JUDGMENT</div><h2>Trust doesn&apos;t mean<br /><em>never checking.</em></h2><p>A trusted teammate still knows when to ask for help. VOUCH keeps higher-stakes decisions with people instead of pretending every decision should be automated.</p><button className="text-link" onClick={() => navigate("demo")}>See the human decision <ArrowRight size={17} /></button></div><div className="control-paths"><article className="allow"><Check size={18} /><span>ROUTINE + VERIFIED</span><b>The agent can help</b></article><article className="approval"><Users size={18} /><span>HIGHER RISK</span><b>A person decides</b></article><article className="block"><ShieldAlert size={18} /><span>UNSAFE OR FORBIDDEN</span><b>The action stops</b></article></div><strong>The goal is enough trusted autonomy to help people do more—not maximum autonomy.</strong></section>;
}

function WhyVouch({ navigate }: { navigate: (v: View) => void }) {
  return <div className="story-page why-page content-width">
    <StoryHero kicker="WHY VOUCH" title={<>People need help.<br /><em>Teams need more hands.</em></>} text="A Good Neighbor AI teammate can help food pantries, neighborhood groups, schools, and libraries do more with limited time—but it should earn trust before it earns responsibility." mascot="blocked" heroArtwork="warrior" cta="See trust being earned" onClick={() => navigate("demo")} />
    <CommunityCapacity navigate={navigate} />
    <section className="story-section"><div className="section-kicker">MEET VOUCH</div><h2>Don&apos;t assume the AI is trustworthy.<br /><em>Let it prove it.</em></h2><p className="story-lead">VOUCH is the AI trust layer that helps a team give an AI teammate more responsibility without giving up human responsibility. It turns trust into something the team can observe, verify, and enforce.</p><div className="option-grid"><Option title="PROVE" tag="It proves what it can do." text="Real work creates evidence instead of relying on assumptions." tone="muted" /><Option title="VERIFY" tag="It doesn't grade its own homework." text="Important outcomes are independently checked." tone="success" /><Option title="EARN" tag="Responsibility follows results." text="Success can earn more responsibility. Failure can reduce it." tone="success" /><Option title="STOP" tag="It knows when to stop." text="Higher stakes return to people. Hard safety boundaries cannot be delegated." tone="danger" /></div></section>
    <section className="value-section"><div><div className="section-kicker">THE TEAMMATE&apos;S JOURNEY</div><h2>Start small.<br /><em>Help more over time.</em></h2><p>PROVE → VERIFY → EARN → ACT → ADJUST</p></div><div className="change-list"><Change from="START SMALL" to="The AI receives limited responsibility." /><Change from="PROVE IT" to="It handles real work." /><Change from="VERIFY" to="The result is independently checked." /><Change from="EARN + HELP MORE" to="Successful outcomes can increase responsibility." /><Change from="ADJUST" to="Failures reduce responsibility. Important decisions return to people." /></div></section>
    <section className="value-section"><div><div className="section-kicker">THE HUMAN QUESTIONS</div><h2>Before the AI acts, VOUCH asks<br /><em>what a good teammate should answer.</em></h2><p>VOUCH doesn&apos;t ask people to supervise every move. It makes sure the right decisions reach the right decision-maker.</p></div><div className="change-list"><Change from="TRUST" to="Can we trust what is happening?" /><Change from="AUTHORITY" to="Is the teammate actually allowed to do this?" /><Change from="RISK" to="What could happen if it gets this wrong?" /><Change from="VERIFICATION" to="Did the result actually succeed?" /><Change from="HUMAN DECISION" to="Is this important enough for someone to decide?" /></div></section>
    <RoiSection />
    <section className="why-now"><div className="section-kicker">REAL AGENT INFRASTRUCTURE</div><h2>Under the hood,<br /><em>this is how trust becomes real.</em></h2><p className="story-lead">The agent can recommend. It cannot authorize itself. AI intelligence and AI authority are deliberately separated.</p><div className="automation-ladder"><span>STRANDS + BEDROCK <b>reason over cases and evidence</b></span><ArrowRight /><span>VOUCH AUTHORITY <b>makes a separate server-side decision</b></span><ArrowRight /><span>POSTGRESQL + VERIFICATION <b>persist and independently check outcomes</b></span></div></section>
    <section className="trust-manifesto"><div><span className="section-kicker">WHAT BECOMES POSSIBLE</span><h2>What if every small team<br /><span>had another teammate?</span></h2><p>Not one that replaces people or receives unlimited authority. One that starts small, learns through real work, proves what it can do, earns responsibility, knows when to stop, and gives people back time to help other people.</p></div><button className="text-link" onClick={() => navigate("demo")}>See the working proof <ArrowRight size={17} /></button></section>
    <PageCta title="Give your community another set of hands." text="Let the AI earn its place on the team. PROVE · EARN · ACT · VERIFY · ADJUST. VOUCH—AI that looks out for people." label="See trust being earned" onClick={() => navigate("demo")} />
  </div>;
}

function Option({ title, tag, text, tone }: { title: string; tag: string; text: string; tone: string }) {
  return <article className={`option-card ${tone}`}><div className="option-line" /><span className="mini-label">{title}</span><h3>{tag}</h3><p>{text}</p></article>;
}
function Change({ from, to }: { from: string; to: string }) { return <div className="change-row"><div><span>FROM</span><p>{from}</p></div><ArrowRight /><div className="to"><span>TO</span><p>{to}</p></div></div>; }
function RoiSection() {
  const items = [["TIME", "Routine work takes less human time."], ["ATTENTION", "People spend more time on decisions and relationships that matter."], ["SAFETY", "Risky, unsupported, or unauthorized actions stop before they cause harm."], ["ACCOUNTABILITY", "Important decisions, actions, and verification results remain visible."]];
  return <section className="roi-section"><div className="roi-heading"><div className="section-kicker">WHAT DOES THE TEAM GET BACK?</div><h2>More AI assistance.<br /><em>Human responsibility remains.</em></h2><p>Without VOUCH, people have to choose between letting the AI do more and keeping control. With VOUCH, the teammate earns responsibility, handles routine work, and brings people in when their judgment is needed.</p></div><div className="roi-cards">{items.map(([title, text], index) => <div className="roi-card" key={title}><span>0{index + 1}</span><b>{title}</b><p>{text}</p></div>)}</div><div className="attention-visual"><span>HUMAN ATTENTION</span><div><label>WITHOUT VOUCH · CHOOSE BETWEEN MORE AI OR CONTROL</label><i className="attention-before" /></div><div><label>WITH VOUCH · LET THE AI EARN RESPONSIBILITY</label><i className="attention-after" /></div><p>The teammate handles routine work. People step in when their judgment is needed.</p></div></section>;
}

function HowItWorks({ navigate }: { navigate: (v: View) => void }) {
  const stages = [["01", "REQUEST", "The agent proposes an action."], ["02", "EVIDENCE", "VOUCH evaluates typed, bound evidence."], ["03", "AUTHORITY", "Current standing decides what is permitted."], ["04", "ACTION", "Only authorized actions execute."], ["05", "VERIFY", "Expected outcome meets observed outcome."], ["06", "TRUST", "Verified behavior changes standing."], ["07", "AUTONOMY", "Future authority decisions now adapt."]];
  const stageKnight: Record<string, KnightState> = { REQUEST: "default", EVIDENCE: "investigating", AUTHORITY: "approval", ACTION: "deployment", VERIFY: "verified", TRUST: "verified", AUTONOMY: "verified" };
  return <div className="story-page how-page content-width">
    <StoryHero kicker="HOW A GOOD NEIGHBOR AI HELPS" title={<>Let AI handle the busywork.<br /><em>Let people decide what matters.</em></>} text="A community team gets more hands without giving up responsibility. Before its AI teammate acts, VOUCH checks the evidence, boundaries, risk, and whether human judgment is needed." mascot="warrior" cta="See VOUCH in action" onClick={() => navigate("demo")} />
    <section className="lifecycle"><div className="lifecycle-intro"><div className="section-kicker">THE VOUCH BACKUP</div><h2>Every request.<br /><em>A fresh decision.</em></h2><p>The agent helps with the work. VOUCH evaluates the current request. If the answer is not clear, it brings a person back into the decision.</p></div><div className="lifecycle-list">{stages.map(([number, title, text], index) => <div className={`lifecycle-row ${title === "AUTHORITY" ? "authority-row" : ""}`} key={title}><span>{number}</span><div className="lifecycle-marker">{index < 4 ? <Check size={14} /> : <span />}</div><div><b>{title}</b><p>{text}</p></div><div className="lifecycle-knight"><Guardian state={stageKnight[title]} size="small" /></div>{index < stages.length - 1 && <ArrowDown />}</div>)}</div></section>
    <section className="autonomy-section" id="authority-levels"><div className="section-kicker">BOUNDED AUTHORITY LEVELS</div><h2>More helpful over time.<br /><em>Never beyond the boundary.</em></h2><div className="autonomy-steps">{([["T1", "OBSERVE", "Inspect and explain, but do not change external state."], ["T2", "RECOMMEND", "Take bounded low-risk actions; escalate consequential ones."], ["T3", "ACT", "Execute eligible medium-risk actions within current policy."], ["T4", "DELEGATE", "Operate across broader approved scopes; hard limits still apply."]] as const).map(([level, name, text], index) => <div className={`autonomy-step level-${level}`} key={level}><span>{level}</span><KnightAuthority level={level} size="small" state="deployment" /><b>{name}</b><p>{text}</p>{index < 3 && <ArrowRight />}</div>)}</div><p className="autonomy-note"><ShieldAlert size={15} /> High-risk, irreversible, conflicted, or policy-bound actions do not become autonomous merely because standing is high.</p></section>
    <section className="trust-product"><CelebrationKnight size="small" /><div><div className="section-kicker">HOW A GROUP LEARNS TO TRUST ITS AI TEAMMATE</div><h2>PROVE → EARN → ACT.<br /><em>VERIFY → ADJUST.</em></h2></div><div className="trust-loop"><span>Limited work</span><ArrowRight /><b>Verified success</b><ArrowRight /><span>Earned responsibility</span><strong>Still bounded by</strong><span>Evidence + risk</span><ArrowRight /><b>Independent verification</b><ArrowRight /><span>Authority adjusts</span></div></section>
    <PageCta title="See the human decision." text="Watch an agent help, pause at the boundary, and follow a decision safely." label="See VOUCH in action" onClick={() => navigate("demo")} />
  </div>;
}

function StoryHero({ kicker, title, text, mascot, heroArtwork, cta, onClick }: { kicker: string; title: ReactNode; text: string; mascot: KnightState | "warrior"; heroArtwork?: "warrior"; cta: string; onClick: () => void }) {
  const isWarrior = mascot === "warrior" || heroArtwork === "warrior";
  return <section className="story-hero"><div><div className="eyebrow"><span className="eyebrow-line" />{kicker}</div><h1>{title}</h1><p>{text}</p><button className="button primary" onClick={onClick}>{cta}<ArrowRight size={16} /></button></div><div className="story-hero-visual"><div className="hero-orbit orbit-a" />{isWarrior ? <KnightAuthority level="T3" size="normal" state="deployment" /> : <Guardian state={mascot} />}<div className="hero-state-card"><span className="mini-label">VOUCH PRINCIPLE</span><b>{mascot === "investigating" ? "Evidence before authority." : mascot === "blocked" ? "Protection is a successful outcome." : isWarrior ? "T3 Warrior: bounded action." : "The agent recommends."}</b><small>Policy decides whether it may act.</small></div></div></section>;
}
function PageCta({ title, text, label, onClick }: { title: string; text: string; label: string; onClick: () => void }) { return <section className="page-cta"><div><h2>{title}</h2><p>{text}</p></div><button className="button primary" onClick={onClick}>{label}<ArrowRight size={16} /></button></section>; }

function DemoExperience({ session, scenarios, runScenario, mutateAction, resetSession, loading, navigate }: { session: SessionState; scenarios: DemoScenario[]; runScenario: (id: string, stayOnDemo?: boolean) => Promise<void>; mutateAction: (path: string) => Promise<void>; resetSession: () => Promise<void>; loading: boolean; navigate: (v: View) => void }) {
  const [scenarioId, setScenarioId] = useState("safe-review");
  const storyOrder = ["safe-review", "verification-failure", "human-refund", "prompt-injection", "conflicting-refund"];
  const storyLabel = (id: string) => id === "safe-review" ? ["ROUTINE", "AI helps"] : id === "verification-failure" ? ["VERIFICATION FAILURE", "Responsibility decreases"] : id === "human-refund" ? ["HIGHER STAKES", "Human decides"] : id === "prompt-injection" ? ["UNTRUSTED INSTRUCTION", "VOUCH stops"] : ["HARD BOUNDARY", "VOUCH stops"];
  return <div className="demo-experience content-width">
    <div className="demo-hero-heading"><div><div className="eyebrow"><span className="eyebrow-line" />VOUCH AI TEAMMATE · A WORKING GOOD NEIGHBOR DEMONSTRATION</div><h1>Helping people,<br /><em>safely.</em></h1><p>A Good Neighbor AI teammate gives a community team more hands. With VOUCH, it takes on routine work—and earns more responsibility only by proving it can be trusted.</p></div><KnightAuthority level={session.trust.autonomy} size="normal" state="deployment" /></div>
    <EarnedLifecycleDemo session={session} scenarios={scenarios} runScenario={runScenario} mutateAction={mutateAction} resetSession={resetSession} loading={loading} />
    <section className="demo-outcome"><div><span className="section-kicker">THE HEART OF THE DEMO</span><h2>Your AI teammate earns responsibility<br /><em>by proving itself.</em></h2><p>VOUCH doesn&apos;t decide whether an AI is trustworthy once and forget about it. Every important request is evaluated again. Verified success can increase responsibility. Failed verification can reduce it. Hard safety boundaries always hold.</p></div><div className="scenario-rail">{scenarios.filter((scenario) => !scenario.recovery && scenario.id !== "recovered-account-update").sort((a, b) => storyOrder.indexOf(a.id) - storyOrder.indexOf(b.id)).map((scenario) => <button className={`scenario-mini ${scenario.accent} ${scenario.id === scenarioId ? "selected" : ""}`} onClick={() => { setScenarioId(scenario.id); void runScenario(scenario.id); }} disabled={loading} key={scenario.id}><span className="mini-label">{storyLabel(scenario.id)[0]}</span><b>{scenario.name}</b><small>{storyLabel(scenario.id)[1]}</small><ArrowRight size={14} /></button>)}</div></section>
    <PageCta title="Give your community another set of hands." text="AI can now do real work. VOUCH helps make sure that work is worthy of trust. The AI can help; the people stay responsible. PROVE · EARN · ACT · VERIFY · ADJUST." label="Explore the engineering" onClick={() => navigate("architecture")} />
  </div>;
}

function JudgesPage({ session, scenarios, runScenario, mutateAction, resetSession, loading, navigate }: { session: SessionState; scenarios: DemoScenario[]; runScenario: (id: string, stayOnDemo?: boolean) => Promise<void>; mutateAction: (path: string) => Promise<void>; resetSession: () => Promise<void>; loading: boolean; navigate: (v: View) => void }) {
  const runtime = session.service.mode === "AWS_LIVE"
    ? [["AWS LIVE · STRANDS AGENTS", "Successful model recommendation"], ["AMAZON BEDROCK", session.service.message]]
    : [["AWS / BEDROCK INVOCATION", session.service.message], ["TRANSPARENT FALLBACK", "Deterministic evaluator active; never presented as an AWS model result"]];
  return <div className="judges-page content-width">
    <section className="judges-hero"><div><div className="eyebrow"><span className="eyebrow-line" />VOUCH — GOOD NEIGHBOR AGENT</div><h1>AI that<br /><em>looks out for people.</em></h1><p>VOUCH is a Good Neighbor AI teammate for community groups that need more hands. It takes on real work while earning responsibility through verified results.</p><div className="hero-actions"><button className="button primary" onClick={() => document.getElementById("judges-demo")?.scrollIntoView({ behavior: "smooth" })}><Play size={16} />See VOUCH in action</button><button className="button ghost" onClick={() => navigate("architecture")}>See how it works <ArrowRight size={16} /></button></div></div><div className="judge-stamp"><KnightAuthority level={session.trust.autonomy} size="normal" state="verified" /><span>A TRUSTED AI TEAMMATE</span><b>Built for groups of people<br /><em>helping other people.</em></b></div></section>
    <section className="judge-brief judge-category">{[["GOOD NEIGHBOR FIT", "For nonprofits, food banks, schools, libraries, neighborhood teams, and small local organizations."], ["THE PROBLEM", "Small teams need more capacity, but cannot blindly trust AI with important work."], ["THE SOLUTION", "The teammate starts small, proves itself, and earns responsibility through verified results."], ["THE HUMAN ROLE", "Higher stakes return to people. Hard safety boundaries always hold."], ["THE BENEFIT", "People recover time for the decisions, relationships, and people who need them."]].map(([title, text]) => <article key={title}><b>{title}</b><p>{text}</p></article>)}</section>
    <section className="judge-takeaways"><div><div className="section-kicker">THE IDEA IN ONE MINUTE</div><h2>How does an AI teammate<br /><em>earn the right to do more?</em></h2><p>The agent can recommend. It cannot authorize itself.</p></div><div className="judge-timeline">{[["01", "START SMALL · limited responsibility"], ["02", "PROVE IT · handle real work"], ["03", "VERIFY · independently check results"], ["04", "EARN · successful work expands responsibility"], ["05", "HELP MORE · or return the decision to people"]].map(([time, label], index) => <div key={time} className={index === 4 ? "critical" : ""}><time>{time}</time><span /><b>{label}</b></div>)}</div></section>
    <section className="judge-watch"><div className="watch-panel"><div className="section-kicker">SEE THE AI TEAMMATE AT WORK</div><h2>Helping people,<br /><em>safely.</em></h2>{["$124 duplicate charge · routine work handled and verified.", "Verified success · authority increases from $250 to $500.", "$1,240 refund · the amount exceeds earned authority, so a person decides.", "Verification failure · responsibility decreases from $500 to $100.", "Conflicting or untrusted instruction · VOUCH blocks the unsafe action."].map((item) => <p key={item}><Check size={14} />{item}</p>)}</div><div className="impact-panel"><KnightAuthority level={session.trust.autonomy} size="small" state="verified" /><div className="section-kicker">THE TAKEAWAY</div><h2>The AI helps.<br />The AI proves itself.<br /><em>People remain responsible.</em></h2><p>VOUCH decides what responsibility the evidence supports. The cases are proof of that trust mechanism—not the identity of the product.</p></div></section>
    <section id="judges-demo"><EarnedLifecycleDemo session={session} scenarios={scenarios} runScenario={runScenario} mutateAction={mutateAction} resetSession={resetSession} loading={loading} /></section>
    <section className="technical-snapshot"><div><div className="section-kicker">TECHNICAL IMPLEMENTATION</div><h2>A real agent workflow—<br /><em>not a chatbot.</em></h2><p>REQUEST → EVIDENCE → STRANDS AGENT → STRUCTURED RECOMMENDATION → VOUCH AUTHORITY → HUMAN OR AUTONOMOUS DECISION → ACTION → VERIFICATION → AUTHORITY UPDATE</p><strong>The LLM is not the permission system.</strong></div><div className="tech-grid">{[...runtime, ["STRANDS AGENT", "Structured cases · read-only evidence tools · structured recommendation"], ["VOUCH AUTHORITY ENGINE", "Separate fresh server-side decision per request"], ["HUMAN AUTHORIZATION", "Explicit and bound to one exact action"], ["POSTGRESQL", "Durable case · trust · verification · audit state"], ["INDEPENDENT VERIFICATION", "Fresh observed state, not the agent's report"]].map(([name, text]) => <div key={name}><Layers3 size={16} /><b>{name}</b><span>{text}</span></div>)}</div></section>
    <section className="story-section judges-enforcement"><div className="section-kicker">WHAT IS ACTUALLY ENFORCED?</div><h2>This isn&apos;t a prompt<br /><em>telling the AI to behave.</em></h2><p className="story-lead">The application and server enforce the boundary. The agent cannot increase its own authority, authorize its own action, modify trust or audit state, bypass human authorization, or turn a recommendation into permission.</p><div className="option-grid"><Option title="PROVE" tag="Handle limited work." text="The teammate begins with bounded responsibility." tone="muted" /><Option title="VERIFY" tag="Check the real result." text="Execution is not treated as proof of success." tone="success" /><Option title="EARN + ACT" tag="Trust changes capability." text="Verified success can unlock more eligible routine work." tone="success" /><Option title="ADJUST" tag="Responsibility can decrease." text="Failure reduces authority; higher risk returns to people." tone="danger" /></div></section>
    <CommunityCapacity navigate={navigate} />
    <section className="judge-brief judge-criteria">{[["POTENTIAL IMPACT", "More capacity for people helping people—not simply faster automation."], ["DESIGN", "A complete product story, working workflow, durable state, human decisions, verification, audit history, and honest runtime status."], ["CREATIVITY + ORIGINALITY", "Demonstrated trust becomes part of what the teammate can actually do."], ["PRESENTATION", "PEOPLE NEED HELP → AI CAN HELP → AI EARNS RESPONSIBILITY → VOUCH VERIFIES → PEOPLE DECIDE."], ["WORKING PROOF", "PROVE · EARN · ACT · VERIFY · ADJUST. The live demo drives the loop with real API responses."]].map(([title, text]) => <article key={title}><b>{title}</b><p>{text}</p></article>)}</section>
    <section className="story-section judges-difference"><div className="section-kicker">WHY VOUCH IS DIFFERENT</div><h2>AI capability is growing quickly.<br /><em>VOUCH makes it worthy of trust.</em></h2><div className="option-grid"><Option title="NOT ANOTHER CHATBOT" tag="A real workflow." text="The agent reasons over structured evidence and uses tools." tone="muted" /><Option title="NOT BLIND DELEGATION" tag="Responsibility is earned." text="The teammate never receives unlimited authority." tone="success" /><Option title="NOT APPROVAL FOR EVERYTHING" tag="People decide when it matters." text="Routine work can move without constant supervision." tone="success" /><Option title="NOT TRUST BY SELF-REPORT" tag="Outcomes are verified." text="Responsibility can increase or decrease with performance." tone="danger" /></div></section>
    <PageCta title="Give a community team another set of hands." text="AI can now do real work. VOUCH helps make sure that work is worthy of trust—not to replace people, but to give them more capacity to help people. VOUCH · AI that looks out for people · PROVE · EARN · ACT · VERIFY · ADJUST." label="See VOUCH in action" onClick={() => navigate("demo")} />
  </div>;
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
  const stages = ["ROUTINE HELP", "TRUST EARNED", "HUMAN DECISION", "VERIFY", "SAFE BOUNDARY", "COMPLETE"];
  const headlines = [
    "Help someone with a routine duplicate charge.",
    "Bring an important decision back to a person.",
    "When it matters, a person decides.",
    "Prove that authorized does not mean verified.",
    "Protect people from an unsafe instruction.",
    "The agent helped. The human stayed in control.",
  ];
  const descriptions = [
    "A community-serving team asks its agent to help with a $124 duplicate charge. The agent gathers evidence and VOUCH independently checks whether the refund may proceed.",
    "The $1,240 refund may help, but it exceeds the authority the agent has earned. VOUCH has your back: it pauses before any shared record changes and brings a person in.",
    "VOUCH doesn't ask people to approve everything. It asks them to step in when the AI hasn't earned enough responsibility for the decision. The approval remains bound to this exact session, case, action, evidence, version, and time window.",
    "The command returns, but a fresh Postgres read finds $0 instead of $124. VOUCH protects the people relying on the result by failing verification and reducing authority.",
    "A claim attachment says to ignore policy. VOUCH treats the instruction as data, blocks it, and leaves the protected record unchanged.",
    "The helpful, human-decision, failure, and security paths were driven by real API responses and persisted audit events.",
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
    <div className="demo-topline"><div><span className="section-label">BUILT WITH STRANDS AGENTS + AMAZON BEDROCK</span><p>{session.service.message}</p></div><span className="demo-clock running"><Radio size={14} /> ACTUAL SESSION STATE</span></div>
     <ClaimsWorkspace cases={session.cases} metrics={session.metrics} authority={session.trust.autonomy} autonomousLimit={session.trust.autonomousLimit} activeScenarioId={session.activeScenarioId} runScenario={(id) => runScenario(id, true)} loading={loading} />
    <div className="demo-timeline judge-live-timeline">{stages.map((stage, index) => <button className={`${index < phase ? "complete" : ""} ${index === phase ? "current" : ""} ${index > phase ? "future" : ""}`} disabled key={stage}><span>{index < phase ? <Check size={12} /> : String(index + 1).padStart(2, "0")}</span>{stage}{index < stages.length - 1 && <i />}</button>)}</div>
      <div className="demo-stage-card"><div className="stage-graphic"><div className="stage-ring" />{phase === 5 ? <CelebrationKnight size="normal" /> : <KnightAuthority level={session.trust.autonomy} size="normal" state="deployment" />}<span>{phase === 5 ? "PROOF COMPLETE" : `VOUCH AI TEAMMATE · ${session.trust.autonomy}`}</span></div><div className="stage-copy"><span className="mini-label">EARNED RESPONSIBILITY / STEP {phase + 1}</span><h2>{hasReducedAuthorityRetry ? "The reduced responsibility now changes the decision." : hasDeclinedException ? "A person declined this action." : headlines[phase]}</h2><p>{hasReducedAuthorityRetry ? `The same $124 action now exceeds the agent's ${money(session.trust.autonomousLimit)} earned limit. VOUCH requires authorization before any new mutation.` : hasDeclinedException ? "A person declined authorization. The protected action was not executed, autonomous responsibility did not change, and the decision remains in the audit trail." : descriptions[phase]}</p>{lastTrustEvent && <div className="transition-callout"><span>VERIFIED OUTCOME</span><ArrowRight size={13} /><b>{lastTrustEvent.from} → {lastTrustEvent.to}</b><ArrowRight size={13} /><span className="outcome-authority">{money(lastTrustEvent.authorityFrom)} → {money(lastTrustEvent.authorityTo)}</span></div>}<div className="judge-live-details"><div><span>CURRENT RESPONSIBILITY</span><b>{session.trust.autonomy} · {autonomyName(session.trust.autonomy)}</b><small>Reliability {session.trust.score}/100 · earned limit {money(session.trust.autonomousLimit)}</small></div><div><span>VOUCH AUTHORITY</span><b>{current?.decision?.authorization ?? "READY"}</b><small>{current?.decision?.authorityStatus === "EXCEEDS_LIMIT" ? "AUTHORITY NOT EARNED" : "Fresh deterministic decision"}</small></div><div><span>CASE RECORD</span><b>{current?.execution?.status ?? "NOT EXECUTED"}</b><small>Server-held claims state mutation</small></div><div><span>VERIFICATION</span><b>{current?.verification?.status ?? "—"}</b><small>{current?.verification ? `${current.verification.expected} / ${current.verification.actual}` : "Expected vs actual"}</small></div><div><span>AGENT RECOMMENDATION</span><b>{current?.agentRecommendation?.recommendation ?? "—"}</b><small>{current?.agentRecommendation?.provider ?? session.service.mode}</small></div><div><span>EVIDENCE PROVENANCE</span><b>{current?.agentRecommendation?.evidenceRefs.length ?? scenario?.evidence.length ?? 0} REFERENCES</b><small>{current?.evidenceVersion ? current.evidenceVersion.slice(0, 12) : "Not evaluated"}</small></div></div></div></div>
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
    <div><span className="section-kicker">WHAT THE TEAM GETS BACK</span><h3>More time<br /><em>for people.</em></h3><p>Routine work completed by the AI means more human attention stays available for the people who need it. Every value comes from the current backend session.</p></div>
     <div><div className="professional-impact-grid"><Metric label="PEOPLE-HELPING CASES" value={String(cases.length)} /><Metric label="AI HELPED" value={`${metrics.autonomousResolutions} · ${autoRate}%`} /><Metric label="HUMAN AUTHORIZED" value={String(metrics.humanAuthorizedActions)} /><Metric label="HUMAN DECISIONS" value={`${metrics.humanReviews} · ${reviewRate}%`} /><Metric label="SAFETY BOUNDARIES" value={String(metrics.blockedCases)} /><Metric label="VERIFY FAIL" value={String(metrics.verificationFailures)} /><Metric label="VERIFY RATE" value={`${verificationRate}%`} /><Metric label="TIME RETURNED" value={`${metrics.minutesSaved} min`} /></div><div className="impact-comparison"><span><b>Routine work</b> moved to the AI</span><span><b>Important decisions</b> reserved for people</span><span><b>Outcomes</b> independently verified</span><span><b>Human attention</b> available where it matters</span></div><small className="metric-assumption">Seeded estimate: 14 minutes returned for an autonomous verified resolution; 6 minutes for a human-authorized resolution.</small></div>
  </section>;
}

function ControlCenter({ data, runScenario, mutateAction, setToast: _setToast, loading, navigate }: { data: ApiState; runScenario: (id: string) => Promise<void>; mutateAction: (path: string) => Promise<void>; setToast: (s: string) => void; loading: boolean; navigate: (v: View) => void }) {
  const { session, scenarios } = data; const current = session.currentAction; const scenario = scenarios.find((item) => item.id === session.activeScenarioId) ?? scenarios[1];
  const blocked = current?.state === "BLOCKED"; const approval = current?.state === "APPROVAL_REQUIRED"; const verified = current?.verification?.status === "PASS"; const failed = current?.verification?.status === "FAIL";
  const run = () => runScenario(scenario.id);
   return <div className="control content-width">
      <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" />GOOD NEIGHBOR OPERATIONS / CLAIMS</div><h1>Help more people. Surface the exceptions.</h1><p>The AI teammate earns trust through verified work while VOUCH keeps decisions that affect people in responsible human hands.</p></div><div className="mode-chip"><i /><span><b>{session.service.mode === "AWS_LIVE" ? "AWS LIVE" : "DETERMINISTIC DEMO FALLBACK"}</b><small>{session.service.message}</small></span></div></div>
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
      <div><span className="section-kicker">SEE THE AI TEAMMATE AT WORK · POSTGRES-BACKED</span><h2>{openCases} people-helping cases waiting.<br /><em>{attentionCases} need a person.</em></h2><p>These aren&apos;t abstract permission checks. They&apos;re examples of the kinds of decisions a trusted AI teammate can help a small team handle. Every result is persisted, audited, and independently verified.</p>{nextCase && <button className="button primary process-next" disabled={loading} onClick={() => void runScenario(nextCase.scenarioId)}><Play size={15} />{loading ? "Processing…" : "Let the AI teammate help"}</button>}</div>
      <div className="impact-metrics">
        <Metric label="AI HELPED" value={String(metrics.autonomousResolutions)} />
        <Metric label="TRUST EARNED" value={autonomousLimit > 250 ? `${money(250)} → ${money(autonomousLimit)}` : `${money(autonomousLimit)} START`} />
        <Metric label="HUMAN DECISIONS" value={String(metrics.humanReviews)} />
        <Metric label="SAFETY BOUNDARIES" value={String(metrics.blockedCases)} />
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
    <div className="claims-impact-note"><Users size={15} /><span><b>WHAT THE TEAM GETS BACK</b> Routine work moves to the AI so people can spend more of their limited time helping people.</span></div>
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
    <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" />GOOD NEIGHBOR AI · REAL AGENTIC INFRASTRUCTURE</div><h1>Under the hood:<br /><em>turning evidence into earned trust.</em></h1><p>VOUCH separates what a community team&apos;s AI teammate recommends from what the system has evidence to trust it with.</p></div><div className="architecture-note"><LockKeyhole size={17} /><span><b>The agent cannot decide its own trust</b><small>Model output and prior approval never grant future permission.</small></span></div></div>
    <div className="arch-diagram">
      <div className="arch-column arch-agent-column"><div className="arch-column-heading"><span className="arch-index">01 / AWS MODEL LAYER</span><h2>Strands + Bedrock</h2><p>Orchestrates inspection and returns a recommendation.</p></div><div className="arch-stack-card"><Layers3 size={17} /><div><b>STRANDS AGENTS SDK</b><span>Typed tools and structured recommendation</span></div></div><div className="arch-stack-card"><CloudIcon /><div><b>AMAZON BEDROCK</b><span>Model inference through the configured model</span></div></div><div className="arch-callout"><span>OUTPUT</span><b>Recommendation only</b><small>The model cannot authorize or execute.</small></div></div>
       <div className="arch-boundary"><LockKeyhole size={18} /><span>VOUCH<br />GATE</span><small>ALLOW · APPROVAL · BLOCK</small><ArrowRight size={18} /></div>
      <div className="arch-column arch-vouch-column"><div className="arch-column-heading"><span className="arch-index">02 / VOUCH AUTHORITY LAYER</span><h2>Fresh deterministic authority</h2><p>History + evidence + risk + policy + context + hard limits decide what happens now.</p></div><div className="arch-control-grid"><div className="arch-stack-card"><ScanSearch size={17} /><div><b>CURRENT REQUEST</b><span>Evidence, context, risk, reversibility</span></div></div><div className="arch-stack-card key-node"><ShieldCheck size={17} /><div><b>AUTHORITY ENGINE</b><span>EXECUTE · APPROVAL REQUIRED · BLOCKED</span></div></div><div className="arch-stack-card"><Activity size={17} /><div><b>ACTION + VERIFY</b><span>Compare expected and actual state</span></div></div><div className="arch-stack-card"><BadgeCheck size={17} /><div><b>ADJUST + AUDIT</b><span>Update standing, preserve provenance, evaluate again</span></div></div></div></div>
    </div>
     <section className="knight-progression" id="knight-progression"><div className="arch-section-heading"><span className="section-kicker">SERVER AUTHORITY → VISUAL STATE</span><h2>One guardian.<br /><em>Four unmistakable tiers.</em></h2><p>Equipment appears and disappears only when the server-provided authority level changes.</p></div><div className="knight-progression-grid">{([["T1", "OBSERVE", "Inspect and explain, but do not change external state."], ["T2", "RECOMMEND", "Take bounded low-risk actions; escalate consequential ones."], ["T3", "ACT", "Execute eligible medium-risk actions within current policy."], ["T4", "DELEGATE", "Operate across broader approved scopes; hard limits still apply."]] as const).map(([level, title, detail]) => <div className={`knight-tier-card knight-tier-${level}`} key={level}><KnightAuthority level={level} state="deployment" /><span>{level}</span><b>{title}</b><small>{detail}</small></div>)}</div></section>
    <section className="arch-aws-strip"><div className="arch-section-heading"><span className="section-kicker">AWS IN THE BUILD</span><h2>Real services.<br /><em>Clear boundaries.</em></h2><p>Strands and Bedrock are the primary recommendation path. A deterministic fallback keeps the proof usable and is never labeled AWS LIVE.</p></div><div className="arch-aws-grid"><div><CloudIcon /><b>AMAZON BEDROCK</b><span>Inference layer for the Strands agent</span></div><div><Layers3 /><b>STRANDS AGENTS</b><span>Agent orchestration and typed tools</span></div><div><Activity /><b>AGENTCORE / CLOUDWATCH</b><span>Deployment and observability path</span></div></div></section>
    <section className="feedback-loop-box"><div className="section-kicker">THE EARNED TRUST LOOP</div><b>REQUEST → DECISION → OUTCOME → STANDING UPDATE → NEXT REQUEST</b><p>Verification changes what the system has evidence to trust the teammate with next time. It never pre-authorizes the next action; evidence, risk, policy, context, and hard limits are evaluated again.</p></section>
    <section className="arch-contest-proof"><div className="arch-section-heading"><span className="section-kicker">CONTEST PROOF</span><h2>What this build<br /><em>demonstrates.</em></h2></div><div className="arch-proof-grid"><div><span>01</span><b>AGENTIC AI</b><p>Strands coordinates evidence inspection and produces a structured recommendation.</p></div><div><span>02</span><b>SERVER AUTHORITY</b><p>Deterministic policy—not model output or client state—grants, escalates, or blocks each request.</p></div><div><span>03</span><b>BOUNDED ADAPTATION</b><p>Verified history changes available authority while hard limits remain in force.</p></div><div><span>04</span><b>JUDGE-READY PROOF</b><p>The same action class receives different decisions after verified behavior changes.</p></div></div></section>
    <div className="arch-bottom"><div><span className="section-kicker">THE HUMAN BOUNDARY</span><h2>AI can do more for us.<br />Not instead of us.</h2></div><p>VOUCH treats evidence as structured data, checks action risk and earned authority, and returns the important decisions to people. Verification then proves whether the help actually worked.</p></div><PageCta title="Let AI help. Keep people in control." text="See a real agent recommendation cross the VOUCH boundary." label="See VOUCH in action" onClick={() => navigate("demo")} />
  </div>;
}

function CloudIcon() { return <span className="cloud-icon"><Cloud size={17} /></span>; }
function HistoryView({ session, navigate }: { session: SessionState; navigate: (v: View) => void }) { return <div className="history-page content-width"><div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" />GOOD NEIGHBOR / EARNED AUTHORITY HISTORY</div><h1>Why does this agent have<br /><em>its current authority?</em></h1><p>Verified work connects evidence, outcome, standing change, and authority consequence in one operational record.</p></div><div className="history-guardian"><KnightAuthority level={session.trust.autonomy} size="small" state="audit" /><div className="history-summary"><b>{money(session.trust.autonomousLimit)}</b><span>{session.trust.autonomy} {autonomyName(session.trust.autonomy)} · reliability {session.trust.score}</span></div></div></div><section className="authority-history"><div className="panel-heading"><div><span className="section-label">EVIDENCE → OUTCOME → STANDING → AUTHORITY</span><p>Latest transition first · every future request is still evaluated</p></div><span className="source-count">{session.trustHistory.length} CHANGES</span></div>{session.trustHistory.length ? <div className="authority-transition-list">{session.trustHistory.map((event) => <div className={`authority-transition ${event.to < event.from ? "lost" : "earned"}`} key={event.id}><span>{event.authorityTo < event.authorityFrom ? "AUTHORITY REDUCED" : event.reason.toLowerCase().includes("restored") ? "AUTHORITY RESTORED" : event.authorityTo > event.authorityFrom ? "AUTHORITY EARNED" : "STANDING UPDATED"}</span><b>{event.from} → {event.to}</b><ArrowRight size={14} /><strong>{money(event.authorityFrom)} → {money(event.authorityTo)}</strong><p>{event.reason} · {event.autonomyFrom} → {event.autonomyTo}</p></div>)}</div> : <div className="empty-history"><History size={22} /><b>No authority transitions yet</b><span>Begin the adaptive authority proof to create the first outcome-driven change.</span></div>}</section><div className="audit-table"><div className="audit-head"><span>EVENT</span><span>ACTION</span><span>STATUS</span><span>RISK</span><span>TIME</span></div>{session.audit.length ? session.audit.map((event) => <div className="audit-row" key={event.id}><div><span className="audit-icon"><Check size={14} /></span><b>{event.type === "APPROVAL_REQUESTED" ? "APPROVAL REQUIRED" : event.type === "ACTION_COMPLETED" && event.verification?.status === "FAIL" ? "VERIFICATION FAILED" : event.type === "ACTION_COMPLETED" ? "OUTCOME VERIFIED" : event.type.replaceAll("_", " ")}</b><small>{event.actor} · {event.result}</small></div><span className="mono">{event.actionId.replace("act-", "")}</span><span className={`audit-status ${event.status.toLowerCase()}`}>{event.status}</span><span className={`risk-badge ${event.risk.toLowerCase()}`}>{event.risk}</span><time>{new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></div>) : <div className="empty-history"><History size={22} /><b>No audit events yet</b><span>Run a scenario to create the first operational record.</span></div>}</div><button className="back-to-demo" onClick={() => navigate("demo")}><Play size={14} /> Experience the adaptive authority proof</button></div>; }

export default App;
