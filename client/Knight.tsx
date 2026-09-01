import { useId } from "react";

export type KnightState = "default" | "investigating" | "blocked" | "approval" | "deployment" | "verified" | "reduced" | "audit";

export const knightLabels: Record<KnightState, string> = {
  default: "READY",
  investigating: "CHECKING",
  blocked: "PROTECTING",
  approval: "WAITING",
  deployment: "AUTHORIZED",
  verified: "VERIFIED",
  reduced: "CAUTIOUS",
  audit: "RECORDED",
};

type Pose = {
  body?: string;
  leftLeg?: string;
  rightLeg?: string;
  leftArm?: string;
  rightArm?: string;
};

const poses: Record<Exclude<KnightState, "default">, Pose> = {
  investigating: {
    body: "translate(-2 4) rotate(-4 92 105)",
    leftArm: "rotate(-6 64 112)",
    rightArm: "rotate(18 126 114)",
  },
  blocked: {
    leftLeg: "translate(-7 0) rotate(7 72 145)",
    rightLeg: "translate(7 0) rotate(-7 111 145)",
    leftArm: "rotate(-22 65 111)",
    rightArm: "rotate(-34 126 114)",
  },
  approval: {
    body: "translate(-2 2) rotate(2 92 105)",
    rightArm: "rotate(-62 126 114)",
  },
  deployment: {
    body: "translate(3 -1) rotate(-3 92 105)",
    leftLeg: "translate(-5 -1) rotate(-17 72 145)",
    rightLeg: "translate(7 2) rotate(17 111 145)",
    leftArm: "rotate(-10 65 111)",
    rightArm: "rotate(19 126 114)",
  },
  verified: {
    body: "translate(0 -5)",
    leftArm: "rotate(-24 65 111)",
    rightArm: "rotate(-42 126 114)",
  },
  reduced: {
    body: "translate(-2 7) rotate(-8 92 105)",
    leftLeg: "rotate(8 72 145)",
    rightLeg: "rotate(-8 111 145)",
    rightArm: "rotate(25 126 114)",
  },
  audit: {
    body: "translate(-2 3) rotate(2 92 105)",
    rightArm: "rotate(16 126 114)",
  },
};

export function KnightArtwork({ state }: { state: Exclude<KnightState, "default"> }) {
  const uid = useId().replace(/:/g, "");
  const pose = poses[state];
  const steel = `steel-${uid}`;
  const darkSteel = `dark-steel-${uid}`;
  const shield = `shield-${uid}`;

  return <svg className="knight-artwork" viewBox="0 0 180 190" role="img" aria-label={`VOUCH Knight ${knightLabels[state].toLowerCase()}`}>
    <defs>
      <linearGradient id={steel} x1=".15" y1=".1" x2=".85" y2=".95"><stop stopColor="#d9eeff"/><stop offset=".48" stopColor="#83b8e9"/><stop offset="1" stopColor="#3d79b8"/></linearGradient>
      <linearGradient id={darkSteel} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#79b9ef"/><stop offset="1" stopColor="#255a91"/></linearGradient>
      <linearGradient id={shield} x1=".25" y1="0" x2=".8" y2="1"><stop stopColor="#8ac9ff"/><stop offset="1" stopColor="#286db0"/></linearGradient>
      <filter id={`shadow-${uid}`}><feDropShadow dx="0" dy="7" stdDeviation="5" floodColor="#04101c" floodOpacity=".45"/></filter>
    </defs>
    <ellipse cx="91" cy="175" rx={state === "deployment" ? 62 : 54} ry="8" fill="#03111f" opacity=".35"/>
    <g transform={pose.body} filter={`url(#shadow-${uid})`}>
      <g transform={pose.leftLeg}>
        <path d="M72 144v23l-17 3c-3 1-4-5-1-8l10-10z" fill="#356b9f" stroke="#d2ebff" strokeWidth="3" strokeLinejoin="round"/>
      </g>
      <g transform={pose.rightLeg}>
        <path d="M111 144v23l17 3c3 1 4-5 1-8l-10-10z" fill="#356b9f" stroke="#d2ebff" strokeWidth="3" strokeLinejoin="round"/>
      </g>

      <path d="M65 104c7-10 17-15 27-15 11 0 21 5 29 15l5 45c-9 9-20 14-34 14-13 0-25-5-33-14z" fill={`url(#${steel})`} stroke="#e0f2ff" strokeWidth="3.5"/>
      <path d="M79 104h26l9 40c-13 7-31 7-44 0z" fill="#4f8bc4" stroke="#cce8ff" strokeWidth="2"/>
      <path d="M92 103v48M77 122h30" stroke="#d5ecff" strokeWidth="2" opacity=".58"/>

      <g transform={pose.leftArm}>
        <path d="M68 101c-13-2-23 6-25 19l16 7 14-21z" fill={`url(#${darkSteel})`} stroke="#d9efff" strokeWidth="3"/>
        <path d="M47 115c-6 8-8 19-4 31l11-2 7-22z" fill="#2d679f" stroke="#b8ddfa" strokeWidth="2.5"/>
        <path d="M44 111c13 2 23 10 28 21-2 18-11 31-26 38-14-9-21-23-19-42z" fill={`url(#${shield})`} stroke="#e3f3ff" strokeWidth="3.5" strokeLinejoin="round"/>
        <path d="m37 130 10 19 12-19h-7l-5 8-4-8z" fill="#f0f8ff"/>
      </g>

      <g transform={pose.rightArm}>
        <path d="M117 101c13-2 23 6 25 19l-16 7-14-21z" fill={`url(#${darkSteel})`} stroke="#d9efff" strokeWidth="3"/>
        <path d="M136 116c6 8 8 19 4 31l-11-2-7-22z" fill="#2d679f" stroke="#b8ddfa" strokeWidth="2.5"/>
        <path d="M125 121l10 26M126 143h18" stroke="#dcefff" strokeWidth="4.5" strokeLinecap="round"/>

        {state === "investigating" && <g>
          <path d="M137 145 151 132" stroke="#75c0ff" strokeWidth="4" strokeLinecap="round"/>
          <circle cx="159" cy="124" r="11" fill="#10243a" stroke="#dff3ff" strokeWidth="3"/>
        </g>}
        {state === "blocked" && <g>
          <path d="M139 145 170 102" stroke="#e2f4ff" strokeWidth="5" strokeLinecap="round"/>
          <path d="m166 99 10-3-4 10z" fill="#ff606d"/>
        </g>}
        {state === "approval" && <g stroke="#f5b942" strokeWidth="3" strokeLinecap="round">
          <path d="M139 146v-13M134 136l-5-8M140 134l1-10M145 136l6-8"/>
        </g>}
        {state === "audit" && <g>
          <path d="M140 126h31v40h-31z" fill="#162c42" stroke="#8ec5ff" strokeWidth="2.5" transform="rotate(4 155 146)"/>
          <path d="M148 138h15M147 147h16M146 156h13" stroke="#8ec5ff" strokeWidth="2" strokeLinecap="round" transform="rotate(4 155 146)"/>
        </g>}
      </g>

      <path d="M54 78C55 39 70 17 92 17s37 22 39 61l-15 6-49-1z" fill={`url(#${steel})`} stroke="#e0f2ff" strokeWidth="3.5"/>
      <path d="M68 48c5-16 13-23 24-23 12 0 21 8 25 24l-12-5-13 6-13-6z" fill="#4a87c2"/>
      <path d="M66 66c4-18 14-27 26-27s22 9 27 27l-5 23c-5 11-13 17-22 17s-18-6-23-17z" fill="#f2c7a9" stroke="#7597b6" strokeWidth="3"/>
      <path d="M63 66l15-18 14 6 15-7 14 19-3-24-52-1z" fill="#6ea9de"/>
      <path d="M66 69l8 4 2 21-8-5zM118 69l-8 4-2 21 8-5z" fill="#4d87bf" stroke="#cfeaff" strokeWidth="2"/>
      <path d="M82 65c3-2 6-2 9 0M99 65c3-2 6-2 9 0" fill="none" stroke="#6f4e42" strokeWidth="2" strokeLinecap="round"/>
      <ellipse cx="86" cy="76" rx="3.8" ry="5" fill="#17334e"/><ellipse cx="103" cy="76" rx="3.8" ry="5" fill="#17334e"/>
      <circle cx="84.8" cy="74.5" r="1.1" fill="#fff"/><circle cx="101.8" cy="74.5" r="1.1" fill="#fff"/>
      <path d="M89 91c4 2 8 2 12 0" fill="none" stroke="#9c5a58" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M92 18V8" stroke="#d9efff" strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M92 11c9-8 18-5 23 2-8-1-14 2-20 8z" fill="#62b6ff"/>
    </g>
  </svg>;
}