import { KnightArtwork } from "./Knight";

const horseUrl = new URL("../attached_assets/generated_images/vouch-kawaii-horse.svg", import.meta.url).href;

export function CelebrationRide() {
  return <div className="celebration-ride" role="img" aria-label="The smiling VOUCH Knight celebrates while riding a cute blue horse">
    <div className="celebration-ride-motion">
      <svg className="celebration-horse" viewBox="0 0 260 220" aria-hidden="true">
        <defs>
          <clipPath id="kawaiiHorseUpper"><rect x="35" y="0" width="210" height="151" /></clipPath>
          <clipPath id="kawaiiHorseHindOuter"><rect x="72" y="123" width="43" height="91" /></clipPath>
          <clipPath id="kawaiiHorseHindInner"><rect x="100" y="121" width="43" height="93" /></clipPath>
          <clipPath id="kawaiiHorseFrontInner"><rect x="139" y="119" width="39" height="95" /></clipPath>
          <clipPath id="kawaiiHorseFrontOuter"><rect x="167" y="116" width="44" height="98" /></clipPath>
        </defs>
        <g className="celebration-horse-leg celebration-horse-leg-a">
          <image href={horseUrl} x="35" y="3" width="210" height="210" clipPath="url(#kawaiiHorseHindOuter)" />
        </g>
        <g className="celebration-horse-leg celebration-horse-leg-b">
          <image href={horseUrl} x="35" y="3" width="210" height="210" clipPath="url(#kawaiiHorseHindInner)" />
        </g>
        <g className="celebration-horse-leg celebration-horse-leg-b">
          <image href={horseUrl} x="35" y="3" width="210" height="210" clipPath="url(#kawaiiHorseFrontInner)" />
        </g>
        <g className="celebration-horse-leg celebration-horse-leg-a">
          <image href={horseUrl} x="35" y="3" width="210" height="210" clipPath="url(#kawaiiHorseFrontOuter)" />
        </g>
        <image href={horseUrl} x="35" y="3" width="210" height="210" clipPath="url(#kawaiiHorseUpper)" />
      </svg>
      <div className="celebration-rider"><KnightArtwork state="verified" /></div>
      <div className="celebration-saddle-front" aria-hidden="true" />
    </div>
    <span className="celebration-ride-label">VERIFIED · VICTORY LAP</span>
  </div>;
}