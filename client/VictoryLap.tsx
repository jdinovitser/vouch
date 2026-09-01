const horseUrl = new URL("../attached_assets/generated_images/vouch-victory-horse.svg", import.meta.url).href;

export function VictoryLap() {
  return <svg className="victory-lap-art" viewBox="0 0 300 150" role="img" aria-label="The VOUCH Knight rides away after a verified action">
    <defs>
      <clipPath id="horseUpper"><rect x="66" y="0" width="158" height="93" /></clipPath>
      <clipPath id="horseHindOuter"><rect x="92" y="80" width="20" height="66" /></clipPath>
      <clipPath id="horseHindInner"><rect x="111" y="79" width="27" height="67" /></clipPath>
      <clipPath id="horseFrontInner"><rect x="154" y="78" width="21" height="68" /></clipPath>
      <clipPath id="horseFrontOuter"><rect x="170" y="76" width="28" height="70" /></clipPath>
      <clipPath id="victoryRiderClip"><rect x="101" y="0" width="88" height="79" rx="4" /></clipPath>
      <filter id="victoryShadow"><feDropShadow dx="0" dy="6" stdDeviation="4" floodColor="#04101c" floodOpacity=".38" /></filter>
    </defs>
    <ellipse cx="145" cy="138" rx="88" ry="6" fill="#03111f" opacity=".3" />
    <g filter="url(#victoryShadow)">
      <g className="victory-leg victory-leg-back">
        <image href={horseUrl} x="66" y="0" width="158" height="158" clipPath="url(#horseHindOuter)" />
      </g>
      <g className="victory-leg victory-leg-front">
        <image href={horseUrl} x="66" y="0" width="158" height="158" clipPath="url(#horseHindInner)" />
      </g>
      <g className="victory-leg victory-leg-front">
        <image href={horseUrl} x="66" y="0" width="158" height="158" clipPath="url(#horseFrontInner)" />
      </g>
      <g className="victory-leg victory-leg-back">
        <image href={horseUrl} x="66" y="0" width="158" height="158" clipPath="url(#horseFrontOuter)" />
      </g>
      <image href={horseUrl} x="66" y="0" width="158" height="158" clipPath="url(#horseUpper)" />
      <path d="M108 57c14-7 31-7 46 1l-5 21h-38z" fill="#477eae" stroke="#d9efff" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M116 63h31M113 70h35" stroke="#a9d8fa" strokeWidth="1.8" strokeLinecap="round" />
      <image href="/vouch-mascot.svg" x="101" y="-3" width="88" height="93" clipPath="url(#victoryRiderClip)" />
      <path d="M109 70c14 4 28 4 42 0l-2 10c-13 4-26 4-39 0z" fill="#255d91" stroke="#d9efff" strokeWidth="2" />
      <path d="M149 64c10-6 19-9 28-7" fill="none" stroke="#d9efff" strokeWidth="2" strokeLinecap="round" />
    </g>
  </svg>;
}