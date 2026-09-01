import { ArchflowLockup } from "@/components/brand/archflow-mark";
import { ChallengeSelect } from "@/components/challenge-select";

export function StudioHeader() {
  return (
    <header className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--panel)] px-4">
      <ArchflowLockup compact />
      <ChallengeSelect />
    </header>
  );
}
