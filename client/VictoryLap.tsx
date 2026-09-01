export function VictoryLap() {
  return <svg className="victory-lap-art" viewBox="0 0 300 150" role="img" aria-label="The VOUCH Knight rides away after a verified action">
    <defs>
      <linearGradient id="victoryHorse" x1=".15" y1=".1" x2=".85" y2=".95">
        <stop stopColor="#77b8ea" />
        <stop offset=".55" stopColor="#3979b5" />
        <stop offset="1" stopColor="#205783" />
      </linearGradient>
      <linearGradient id="victorySaddle" x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#d9efff" />
        <stop offset="1" stopColor="#6ea9de" />
      </linearGradient>
      <filter id="victoryShadow"><feDropShadow dx="0" dy="7" stdDeviation="5" floodColor="#04101c" floodOpacity=".42" /></filter>
    </defs>
    <ellipse cx="151" cy="134" rx="103" ry="7" fill="#03111f" opacity=".3" />
    <g filter="url(#victoryShadow)">
      <path d="M48 96c7-28 29-39 62-36 25 2 44 14 56 33 17-7 28-19 33-37 4-15 13-22 27-18 12 4 16 14 10 26-7 15-18 28-35 39-12 8-25 13-41 15H69c-13 0-21-7-21-22z" fill="url(#victoryHorse)" stroke="#d8efff" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M200 54c8-17 17-28 30-30 15-2 26 6 30 19l-13 22-29 10z" fill="url(#victoryHorse)" stroke="#d8efff" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M246 41c8 1 13 5 16 11M255 48l-17 7" fill="none" stroke="#bfe5ff" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="247" cy="38" r="3" fill="#17334e" />
      <path d="M232 31c8-11 17-12 25-4l-7 14z" fill="#255d91" stroke="#a9d8fa" strokeWidth="2" />
      <path d="M57 92c-17-5-25-15-28-28-2-8 2-13 9-12 13 3 23 12 30 27z" fill="none" stroke="#6ea9de" strokeWidth="7" strokeLinecap="round" />
      <path d="M76 106v27M145 106v27M217 91l-3 42" fill="none" stroke="#8fc9f4" strokeWidth="8" strokeLinecap="round" />
      <path d="M69 105h91c13-1 25-5 35-11" fill="none" stroke="#1c4e79" strokeWidth="10" strokeLinecap="round" />
      <path d="M91 69c23-14 51-13 72 4l-8 24H99z" fill="url(#victorySaddle)" stroke="#e2f4ff" strokeWidth="3" />
      <path d="M108 76h39M103 84h50" stroke="#6b9fcf" strokeWidth="2" strokeLinecap="round" opacity=".8" />
      <path d="M180 61c8-9 18-13 28-11" fill="none" stroke="#e2f4ff" strokeWidth="3" strokeLinecap="round" />
      <path d="M176 64c11 4 19 10 24 18" fill="none" stroke="#7db9e8" strokeWidth="3" strokeLinecap="round" />
      <image href="/vouch-mascot.svg" x="92" y="-5" width="116" height="122" />
    </g>
  </svg>;
}