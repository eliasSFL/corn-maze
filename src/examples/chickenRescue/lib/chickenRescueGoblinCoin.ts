import type { GeneratorJob, MinigameRuntimeState } from "lib/portal/processAction";

export type WormDropJob = {
  id: string;
  outputToken: string;
  startedAt: number;
  completesAt: number;
  requires?: string;
};

export function wormDropJobs(
  generating: MinigameRuntimeState["generating"],
): WormDropJob[] {
  return Object.entries(generating)
    .filter(([, j]: [string, GeneratorJob]) => j.outputToken === "Worm")
    .map(([id, j]) => ({
      id,
      outputToken: j.outputToken,
      startedAt: j.startedAt,
      completesAt: j.completesAt,
      requires: j.requires,
    }));
}

export function wormDropCookProgressPercent(
  job: WormDropJob,
  now: number,
): number {
  const total = job.completesAt - job.startedAt;
  if (total <= 0) return 100;
  const elapsed = now - job.startedAt;
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}
