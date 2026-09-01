import { KnightArtwork } from "./Knight";

const horseUrl = "/vouch-kawaii-horse-clean.svg";

export function CelebrationRide() {
  return <figure className="stage-celebration-ride" role="img" aria-label="The VOUCH Knight walks a cute blue horse">
    <div className="stage-ride-art">
      <svg className="stage-walking-horse" viewBox="0 0 260 220" aria-hidden="true">
        <defs>
          <clipPath id="walkingHorseBody"><rect x="25" y="0" width="210" height="158" /></clipPath>
          <clipPath id="walkingHorseLeg0"><rect x="43" y="138" width="57" height="82" /></clipPath>
          <clipPath id="walkingHorseLeg1"><rect x="82" y="135" width="61" height="85" /></clipPath>
          <clipPath id="walkingHorseLeg2"><rect x="119" y="130" width="60" height="90" /></clipPath>
          <clipPath id="walkingHorseLeg3"><rect x="154" y="127" width="61" height="93" /></clipPath>
        </defs>
        <g className="walking-leg walking-leg-a">
          <image href={horseUrl} x="25" y="3" width="210" height="210" clipPath="url(#walkingHorseLeg0)" />
        </g>
        <g className="walking-leg walking-leg-b">
          <image href={horseUrl} x="25" y="3" width="210" height="210" clipPath="url(#walkingHorseLeg1)" />
        </g>
        <g className="walking-leg walking-leg-b">
          <image href={horseUrl} x="25" y="3" width="210" height="210" clipPath="url(#walkingHorseLeg2)" />
        </g>
        <g className="walking-leg walking-leg-a">
          <image href={horseUrl} x="25" y="3" width="210" height="210" clipPath="url(#walkingHorseLeg3)" />
        </g>
        <image href={horseUrl} x="25" y="3" width="210" height="210" clipPath="url(#walkingHorseBody)" />
      </svg>
      <div className="stage-rider"><KnightArtwork state="verified" showShadow={false} /></div>
    </div>
    <figcaption>VERIFIED · VICTORY LAP</figcaption>
  </figure>;
}