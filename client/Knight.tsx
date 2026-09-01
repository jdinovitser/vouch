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

export function KnightArtwork({ state }: { state: KnightState }) {
  const base = state === "deployment"
    ? { x: 72, y: 6, width: 124, height: 131 }
    : { x: 64, y: 18, width: 132, height: 139 };

  return <svg className="knight-artwork" viewBox="0 0 260 220" role="img" aria-label={`VOUCH Knight ${knightLabels[state].toLowerCase()}`}>
    {state === "deployment" && <g className="knight-prop horse-prop">
      <path d="M32 168c6-36 31-55 66-54 25 1 41 13 54 31 15-17 25-36 22-56 21 3 32 17 29 38-3 19-15 33-32 43H67c-5 14-14 20-26 19-11-1-14-10-9-21z" fill="#3979b5" stroke="#d8efff" strokeWidth="3"/>
      <path d="M48 151c20-18 48-17 68-2M78 171v34M137 171v33" fill="none" stroke="#9bd2ff" strokeWidth="6" strokeLinecap="round"/>
      <path d="M188 96c9-8 18-7 25 0l-11 8z" fill="#8ec5ff" stroke="#d8efff" strokeWidth="3"/>
      <circle cx="205" cy="82" r="3" fill="#e7f6ff"/>
      <path d="M61 135h78v24H61z" fill="#234f7d" stroke="#bfe4ff" strokeWidth="2"/>
      <path d="M84 135v23M119 135v23" stroke="#88c5f3" strokeWidth="2"/>
    </g>}

    <image href="/vouch-mascot.svg" {...base} />

    {state === "investigating" && <g className="knight-prop">
      <circle cx="50" cy="82" r="17" fill="#10243a" stroke="#dff3ff" strokeWidth="4"/>
      <path d="M62 94l15 15" stroke="#75c0ff" strokeWidth="5" strokeLinecap="round"/>
      <path d="M127 176H65l8-25h46z" fill="#172d43" stroke="#67b8ff" strokeWidth="2"/>
      <path d="M80 165h36M84 173h27" stroke="#9dd3ff" strokeWidth="2" strokeLinecap="round"/>
    </g>}

    {state === "blocked" && <g className="knight-prop">
      <path d="M176 79l43-30" stroke="#e2f4ff" strokeWidth="6" strokeLinecap="round"/>
      <path d="M214 46l9 3-8 7z" fill="#ff606d"/>
      <path d="M176 79l10 9" stroke="#315d8b" strokeWidth="8" strokeLinecap="round"/>
      <path d="M45 91c17 4 31 15 37 30-2 27-16 45-37 54-19-12-29-30-26-55z" fill="#2d76bd" stroke="#eef8ff" strokeWidth="4"/>
      <path d="m33 121 12 25 16-25h-9l-7 11-5-11z" fill="#fff"/>
      <path d="M27 181h72" stroke="#ff606d" strokeWidth="3" strokeLinecap="round"/>
    </g>}

    {state === "approval" && <g className="knight-prop">
      <circle cx="210" cy="92" r="23" fill="#10243a" stroke="#f5b942" strokeWidth="3"/>
      <path d="M210 78v14l9 6" fill="none" stroke="#ffd477" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M43 159c8-11 17-13 28-7l9 21-31 4z" fill="#4c8bc6" stroke="#d5ecff" strokeWidth="3"/>
      <path d="M43 185h63" stroke="#f5b942" strokeWidth="3" strokeLinecap="round"/>
    </g>}

    {state === "deployment" && <g className="knight-prop">
      <path d="M174 116l31-20" stroke="#e3f4ff" strokeWidth="4" strokeLinecap="round"/>
      <path d="M179 205h49" stroke="#48d597" strokeWidth="3" strokeLinecap="round"/>
    </g>}

    {state === "verified" && <g className="knight-prop">
      <circle cx="211" cy="54" r="22" fill="#143b3a" stroke="#48d597" strokeWidth="3"/>
      <path d="m199 54 8 8 16-18" fill="none" stroke="#8af0bd" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M46 184h164" stroke="#48d597" strokeWidth="3" strokeLinecap="round"/>
    </g>}

    {state === "reduced" && <g className="knight-prop">
      <circle cx="42" cy="106" r="25" fill="#3c4a55" stroke="#f5b942" strokeWidth="3"/>
      <path d="M42 94v16M42 118v2" stroke="#ffd477" strokeWidth="4" strokeLinecap="round"/>
      <path d="M49 190h159" stroke="#f5b942" strokeWidth="3" strokeDasharray="5 6" strokeLinecap="round"/>
    </g>}

    {state === "audit" && <g className="knight-prop">
      <path d="M169 102h56v70h-56z" fill="#162c42" stroke="#8ec5ff" strokeWidth="3" transform="rotate(5 197 137)"/>
      <path d="M181 117h29M179 131h31M177 145h27" stroke="#8ec5ff" strokeWidth="3" strokeLinecap="round" transform="rotate(5 197 137)"/>
      <path d="M44 184h172" stroke="#8ec5ff" strokeWidth="2" strokeDasharray="2 6"/>
    </g>}
  </svg>;
}