/** Title-style label for HUD (e.g. "blacksmith" → "Blacksmith"). */
export function formatNpcDisplayName(npcName: string): string {
  return npcName
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
