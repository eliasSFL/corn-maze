/**
 * Ask Sunflower Land (parent of the minigame iframe) to close the portal modal.
 * Parent listens for `{ event: "closePortal" }` on `window.message`.
 */
export function requestClosePortal(): void {
  try {
    if (window.parent !== window) {
      window.parent.postMessage({ event: "closePortal" }, "*");
    }
  } catch {
    // cross-origin or detached
  }
}
