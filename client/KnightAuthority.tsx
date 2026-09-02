import type { AutonomyLevel } from "../shared/types";
import type { KnightState } from "./Knight";
import traineeArtwork from "../attached_assets/generated_images/vouch-trainee-chibi-final.png";
import squireArtwork from "../attached_assets/generated_images/vouch-squire-chibi-final.png";
import warriorArtwork from "../attached_assets/generated_images/vouch-warrior-chibi-final.png";
import knightArtwork from "../attached_assets/generated_images/vouch-knight-chibi-final.png";
import mountedKnightArtwork from "../attached_assets/generated_images/vouch-mounted-knight-chibi-final.png";

export const authorityKnightLabels: Record<AutonomyLevel, { label: string; role: string }> = {
  T1: { label: "TRAINEE", role: "OBSERVE" },
  T2: { label: "SQUIRE", role: "RECOMMEND" },
  T3: { label: "WARRIOR", role: "ACT" },
  T4: { label: "KNIGHT", role: "DELEGATE" },
};

const authorityArtwork: Record<AutonomyLevel, string> = {
  T1: traineeArtwork,
  T2: squireArtwork,
  T3: warriorArtwork,
  T4: knightArtwork,
};

const authorityEquipment: Record<AutonomyLevel, string> = {
  T1: "unarmored",
  T2: "training sword shield",
  T3: "armor shield sword",
  T4: "golden armor shield sword cape",
};

type Props = {
  level: AutonomyLevel;
  size?: "normal" | "small";
  state?: Exclude<KnightState, "default">;
};

export function KnightAuthority({ level, size = "normal", state = "deployment" }: Props) {
  const authority = authorityKnightLabels[level];
  return <div className={`authority-knight authority-knight-${level} authority-knight-${size} authority-knight-state-${state}`} aria-label={`${authority.label} · ${authority.role}`}>
    <img
      className="knight-artwork knight-authority-image"
      src={authorityArtwork[level]}
      alt={`${level} ${authority.label} — ${authority.role}`}
      data-authority-artwork={level}
      data-equipment={authorityEquipment[level]}
    />
    <div className="authority-knight-caption"><b>{authority.label}</b><span>{authority.role}</span></div>
  </div>;
}

export function CelebrationKnight({ size = "normal" }: { size?: "normal" | "small" }) {
  return <div className={`authority-knight authority-knight-celebration authority-knight-${size}`} aria-label="VOUCH Knight celebrating a verified proof">
    <img className="knight-artwork knight-authority-image" src={mountedKnightArtwork} alt="VOUCH mounted knight celebrating verified proof completion" data-authority-artwork="T5" />
    <div className="authority-knight-caption"><b>PROOF COMPLETE</b><span>VERIFIED CELEBRATION</span></div>
  </div>;
}