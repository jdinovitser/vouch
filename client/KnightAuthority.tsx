import { useId } from "react";
import type { AutonomyLevel } from "../shared/types";
import type { KnightState } from "./Knight";

export const authorityKnightLabels: Record<AutonomyLevel, { label: string; role: string }> = {
  T1: { label: "NOT TRUSTED", role: "OBSERVE" },
  T2: { label: "IN TRAINING", role: "RECOMMEND" },
  T3: { label: "SQUIRE", role: "BOUNDED ACTION" },
  T4: { label: "FULL KNIGHT", role: "DELEGATED ACTION" },
};

type Props = {
  level: AutonomyLevel;
  size?: "normal" | "small";
  state?: Exclude<KnightState, "default">;
};

export function KnightAuthority({ level, size = "normal", state = "deployment" }: Props) {
  const authority = authorityKnightLabels[level];
  return <div className={`authority-knight authority-knight-${level} authority-knight-${size}`} aria-label={`${authority.label} · ${authority.role}`}>
    <AuthorityArtwork level={level} state={state} />
    <div className="authority-knight-caption"><b>{authority.label}</b><span>{authority.role}</span></div>
  </div>;
}

function AuthorityArtwork({ level, state }: { level: AutonomyLevel; state: Exclude<KnightState, "default"> }) {
  const uid = useId().replace(/:/g, "");
  const steel = `authority-steel-${uid}`;
  const darkSteel = `authority-dark-steel-${uid}`;
  const shield = `authority-shield-${uid}`;
  const shadow = `authority-shadow-${uid}`;
  const armored = level !== "T1";
  const armed = level === "T3" || level === "T4";
  const mounted = level === "T4";
  const pose = state === "verified" ? "translate(0 -4)" : state === "blocked" ? "rotate(-4 90 110)" : state === "approval" ? "rotate(3 90 110)" : "";
  const riderTransform = mounted ? `translate(90 98) scale(.88) translate(-90 -98) translate(-1 -23) ${pose}` : `${level === "T1" ? "translate(90 98) scale(.76) translate(-90 -98)" : level === "T2" ? "translate(90 98) scale(.93) translate(-90 -98)" : ""} ${pose}`;

  return <svg className={`knight-artwork knight-authority-artwork knight-authority-${level}`} viewBox="0 0 200 220" role="img" aria-label={`${authorityKnightLabels[level].label} VOUCH Knight`}>
    <defs>
      <linearGradient id={steel} x1=".15" y1=".1" x2=".85" y2=".95"><stop stopColor="#d9eeff"/><stop offset=".48" stopColor="#83b8e9"/><stop offset="1" stopColor="#3d79b8"/></linearGradient>
      <linearGradient id={darkSteel} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#79b9ef"/><stop offset="1" stopColor="#255a91"/></linearGradient>
      <linearGradient id={shield} x1=".25" y1="0" x2=".8" y2="1"><stop stopColor="#8ac9ff"/><stop offset="1" stopColor="#286db0"/></linearGradient>
      <filter id={shadow}><feDropShadow dx="0" dy="7" stdDeviation="5" floodColor="#04101c" floodOpacity=".45"/></filter>
    </defs>
    {mounted && <g className="knight-horse" aria-label="Delegated authority horse">
      <ellipse cx="97" cy="164" rx="61" ry="26" fill="#2d679f" stroke="#c9e7ff" strokeWidth="3"/>
      <path d="M133 159c4-30 16-53 34-60l16 11-6 39-18 18M151 105c12-10 26-9 31 1l-8 17-19-4M47 177l-6 30M78 181l-2 27M116 181l7 27M142 176l13 29" fill="none" stroke="#78afe0" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M146 112c11 10 18 14 29 16M53 151h70" fill="none" stroke="#1c466f" strokeWidth="7" strokeLinecap="round"/>
      <path d="M55 148c17-8 47-8 70 2l-5 15c-21-7-44-7-65 0z" fill="#f5b942" stroke="#dcefff" strokeWidth="2"/>
      <path d="M176 101l12-10M177 102l13 2" stroke="#d9efff" strokeWidth="3" strokeLinecap="round"/>
    </g>}
    <ellipse cx="97" cy="211" rx={mounted ? 82 : level === "T1" ? 38 : 62} ry="7" fill="#03111f" opacity=".35"/>
    <g transform={riderTransform} filter={`url(#${shadow})`}>
      {level === "T1" ? <g className="knight-clothing">
        <path d="M72 142v33l-13 27c7 5 16 4 23-1l8-25 8 25c7 5 16 6 23 1l-13-27v-33z" fill="#496782" stroke="#bed1e3" strokeWidth="3"/>
        <path d="M68 105c-7 8-10 20-8 34 11 8 27 12 40 12s29-4 40-12c2-14-1-26-8-34l-20 11H88z" fill="#e1b18f" stroke="#9e7a70" strokeWidth="3"/>
        <path d="M68 108c-5 5-8 14-7 23l15 4 3-23zM132 108c5 5 8 14 7 23l-15 4-3-23z" fill="#6e4c45"/>
        <path d="M62 137c-10 1-16 8-16 19l15 5 12-19M138 137c10 1 16 8 16 19l-15 5-12-19" fill="#5d7890" stroke="#c9dceb" strokeWidth="3"/>
      </g> : <g className="knight-armor">
        <g className="knight-armored-legs">
          <path d="M72 143v34l-17 3c-3 1-4-5-1-8l10-15v-14z" fill="#356b9f" stroke="#d2ebff" strokeWidth="3" strokeLinejoin="round"/>
          <path d="M111 143v34l17 3c3 1 4-5 1-8l-10-15v-14z" fill="#356b9f" stroke="#d2ebff" strokeWidth="3" strokeLinejoin="round"/>
        </g>
        <path d="M65 104c7-10 17-15 27-15 11 0 21 5 29 15l5 45c-9 9-20 14-34 14-13 0-25-5-33-14z" fill={`url(#${steel})`} stroke="#e0f2ff" strokeWidth="3.5"/>
        <path d="M79 104h26l9 40c-13 7-31 7-44 0z" fill="#4f8bc4" stroke="#cce8ff" strokeWidth="2"/>
        <path d="M92 103v48M77 122h30" stroke="#d5ecff" strokeWidth="2" opacity=".58"/>
      </g>}

      {level === "T1" ? <g className="knight-clothing">
        <path d="M69 105c-12-2-21 7-23 20l16 6 14-20zM115 105c12-2 21 7 23 20l-16 6-14-20z" fill="#5d7890" stroke="#c9dceb" strokeWidth="3"/>
        <circle cx="61" cy="132" r="7" fill="#e1b18f"/><circle cx="123" cy="132" r="7" fill="#e1b18f"/>
      </g> : <g className="knight-armor">
        <g><path d="M68 101c-13-2-23 6-25 19l16 7 14-21z" fill={`url(#${darkSteel})`} stroke="#d9efff" strokeWidth="3"/>
          <path d="M47 115c-6 8-8 19-4 31l11-2 7-22z" fill="#2d679f" stroke="#b8ddfa" strokeWidth="2.5"/>
          {armed && <g className="knight-shield"><path d="M44 111c13 2 23 10 28 21-2 18-11 31-26 38-14-9-21-23-19-42z" fill={`url(#${shield})`} stroke="#e3f3ff" strokeWidth="3.5" strokeLinejoin="round"/><path d="m37 130 10 19 12-19h-7l-5 8-4-8z" fill="#f0f8ff"/></g>}
        </g>
        <g><path d="M117 101c13-2 23 6 25 19l-16 7-14-21z" fill={`url(#${darkSteel})`} stroke="#d9efff" strokeWidth="3"/>
          <path d="M136 116c6 8 8 19 4 31l-11-2-7-22z" fill="#2d679f" stroke="#b8ddfa" strokeWidth="2.5"/>
          <path d="M125 121l10 26M126 143h18" stroke="#dcefff" strokeWidth="4.5" strokeLinecap="round"/>
          {armed && <g className="knight-sword" aria-label="Earned authority sword"><path d="M141 143 164 95" stroke="#e5f5ff" strokeWidth="5" strokeLinecap="round"/><path d="m160 96 8-12 1 15z" fill="#f5fbff"/><path d="M134 143h18" stroke="#f5b942" strokeWidth="4" strokeLinecap="round"/><path d="M143 138v10" stroke="#b8792d" strokeWidth="3" strokeLinecap="round"/></g>}
        </g>
      </g>}

      {state === "investigating" && <g className="knight-ledger-investigation"><path d="M137 145 151 132" stroke="#75c0ff" strokeWidth="4" strokeLinecap="round"/><circle cx="159" cy="124" r="11" fill="#10243a" stroke="#dff3ff" strokeWidth="3"/></g>}
      {state === "blocked" && <g className="knight-guarding">
        {armed ? <path d="M139 145 170 102" stroke="#e2f4ff" strokeWidth="5" strokeLinecap="round"/> : <circle cx="150" cy="122" r="10" fill="#ff606d" opacity=".9"/>}
        <path d={armed ? "m166 99 10-3-4 10z" : "M146 118l8 8M154 118l-8 8"} stroke="#ffeff1" strokeWidth="2.5" strokeLinecap="round"/>
      </g>}
      {state === "approval" && <g stroke="#f5b942" strokeWidth="3" strokeLinecap="round"><path d="M139 146v-13M134 136l-5-8M140 134l1-10M145 136l6-8"/></g>}
      {state === "audit" && <g className="knight-ledger" aria-label="Verified history ledger"><path d="M140 126h31v40h-31z" fill="#162c42" stroke="#8ec5ff" strokeWidth="2.5" transform="rotate(4 155 146)"/><path d="M148 138h15M147 147h16M146 156h13" stroke="#8ec5ff" strokeWidth="2" strokeLinecap="round" transform="rotate(4 155 146)"/></g>}

      {armored ? <g className="knight-helmet">
        <path d="M54 78C55 39 70 17 92 17s37 22 39 61l-15 6-49-1z" fill={`url(#${steel})`} stroke="#e0f2ff" strokeWidth="3.5"/>
        <path d="M68 48c5-16 13-23 24-23 12 0 21 8 25 24l-12-5-13 6-13-6z" fill="#4a87c2"/>
        <path d="M63 66l15-18 14 6 15-7 14 19-3-24-52-1z" fill="#6ea9de"/>
        <path d="M66 69l8 4 2 21-8-5zM118 69l-8 4-2 21 8-5z" fill="#4d87bf" stroke="#cfeaff" strokeWidth="2"/>
        <path d="M92 18V8" stroke="#d9efff" strokeWidth="3.5" strokeLinecap="round"/><path d="M92 11c9-8 18-5 23 2-8-1-14 2-20 8z" fill="#62b6ff"/>
      </g> : <path className="knight-hair" d="M66 73c0-25 11-38 26-38 17 0 28 14 28 38l-9-8-10 5-11-6-13 7z" fill="#5b413b" stroke="#8f6b61" strokeWidth="3"/>}
      <path d="M66 66c4-18 14-27 26-27s22 9 27 27l-5 23c-5 11-13 17-22 17s-18-6-23-17z" fill="#f2c7a9" stroke="#7597b6" strokeWidth="3"/>
      <path d="M82 65c3-2 6-2 9 0M99 65c3-2 6-2 9 0" fill="none" stroke="#6f4e42" strokeWidth="2" strokeLinecap="round"/>
      <ellipse cx="86" cy="76" rx="3.8" ry="5" fill="#17334e"/><ellipse cx="103" cy="76" rx="3.8" ry="5" fill="#17334e"/>
      <circle cx="84.8" cy="74.5" r="1.1" fill="#fff"/><circle cx="101.8" cy="74.5" r="1.1" fill="#fff"/>
      <path d={state === "verified" ? "M87 89c5 7 13 7 18 0" : "M89 91c4 2 8 2 12 0"} fill="none" stroke="#9c5a58" strokeWidth="2.5" strokeLinecap="round"/>
    </g>
  </svg>;
}