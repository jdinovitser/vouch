import type { AutonomyLevel } from "../shared/types";
import type { KnightState } from "./Knight";
import traineeArtwork from "../Knight Images/T1 - trainee_no_bg.png";
import squireArtwork from "../Knight Images/T2 - squire_no_bg.png";
import warriorArtwork from "../Knight Images/T3 - warrior_no_bg.png";
import knightArtwork from "../Knight Images/T4 - knight_no_bg.png";
import celebrateArtwork from "../Knight Images/T5 - celebrate_no_bg.png";

export const authorityKnightLabels: Record<AutonomyLevel, { label: string; role: string }> = {
  T1: { label: "TRAINEE", role: "OBSERVE" },
  T2: { label: "ARMORED APPRENTICE", role: "RECOMMEND" },
  T3: { label: "ARMED SQUIRE", role: "ACT" },
  T4: { label: "MOUNTED KNIGHT", role: "DELEGATE" },
};

const authorityArtwork: Record<AutonomyLevel, string> = {
  T1: traineeArtwork,
  T2: squireArtwork,
  T3: warriorArtwork,
  T4: knightArtwork,
};

const authorityEquipment: Record<AutonomyLevel, string> = {
  T1: "unarmored",
  T2: "armor",
  T3: "armor shield sword",
  T4: "mounted full-equipment",
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
    <img className="knight-artwork knight-authority-image" src={celebrateArtwork} alt="VOUCH Knight celebrating verified proof completion" data-authority-artwork="T5" />
    <div className="authority-knight-caption"><b>PROOF COMPLETE</b><span>VERIFIED CELEBRATION</span></div>
  </div>;
}