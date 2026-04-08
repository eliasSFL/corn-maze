import { formatString } from "./strings";

/** Non-React copy (Phaser / utilities). */
export function translate(key: string): string {
  return formatString(key);
}
