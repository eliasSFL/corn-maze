/** Minimal English copy for the Chicken Rescue template example. */
export const EN_STRINGS: Record<string, string> = {
  error: "Error",
  "error.wentWrong": "Something went wrong. Please try again.",
  retry: "Retry",
  "session.expired": "Session expired!",
  close: "Close",
  loading: "Loading…",
  continue: "Continue",
  exit: "Exit",
  "last.updated": "Last updated:",
  "base.far.away": "You are too far away",
  "base.iam.far.away": "I am too far away",
  "minigame.chickenRescue": "Minigame - Chicken Rescue",
  "minigame.chickenRescueBumpkinDialogue":
    "If you want to play in my fields.\nYou must pay me coins.\nIt costs one coin to enter and catch my chooks.",
  "minigame.chickenRescue.collectChooksTitle": "Collect chooks",
  "minigame.chickenRescue.welcomeBody":
    "Pssst, are you looking for chooks? Use your worms and chicken feet to attract and catch them. Shops and wormeries are in Sunflower Land.",
  "minigame.chickenRescue.gameOver": "Game over",
  "minigame.chickenRescue.resultsFoundChooks":
    "Congratulations, you found some chooks.",
  "minigame.chickenRescue.resultsNoChooks":
    "Bad luck, you didn't catch any chooks.",
  "minigame.chickenRescue.foundChooksLine": "You found {{count}} chooks.",
  "minigame.chickenRescue.foundGoldenChooksLine":
    "You found {{count}} golden chooks.",
  "minigame.swipeToMove": "Swipe to move around",
  "minigame.arrowKeysToMove": "Use WASD or arrow keys to move around",
  "minigame.noCoinsRemaining": "No worms remaining",
  "minigame.coinsRemaining": "worms left",
  "minigame.shopBack": "Back",
  "minigame.shopConfirm": "Confirm",
};

function interpolate(
  template: string,
  args?: Record<string, string | number>,
): string {
  if (!args) return template;
  let out = template;
  for (const [k, v] of Object.entries(args)) {
    out = out.split(`{{${k}}}`).join(String(v));
  }
  return out;
}

export function formatString(
  key: string,
  args?: Record<string, string | number>,
): string {
  const raw = EN_STRINGS[key] ?? key;
  return interpolate(raw, args);
}
