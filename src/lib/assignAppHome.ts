/** Full navigation to the app root (handles Vite `BASE_URL`). */
export function assignAppHome(): void {
  const base = import.meta.env.BASE_URL;
  if (base === "./") {
    window.location.assign("./");
    return;
  }
  window.location.assign(base.endsWith("/") ? base : `${base}/`);
}
