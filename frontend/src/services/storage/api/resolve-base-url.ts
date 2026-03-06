declare global {
  interface Window {
    __INGRESS_PATH__?: string;
    OC?: { generateUrl: (path: string) => string };
  }
}

export function resolveApiBaseUrl(): string {
  if (__BUILD_TARGET__ === "nextcloud") {
    return (
      window.OC?.generateUrl("/apps/gilbertstodo") ?? "/apps/gilbertstodo"
    );
  }

  // 1. Detect HA ingress from current URL (works even with PWA cache)
  const ingressMatch = window.location.pathname.match(
    /^(\/api\/hassio_ingress\/[^/]+)/,
  );
  if (ingressMatch) {
    return ingressMatch[1];
  }

  // 2. Home Assistant ingress path (injected by server, legacy fallback)
  const ingress = window.__INGRESS_PATH__;
  if (ingress && ingress !== "" && ingress !== "__INGRESS_PATH__") {
    return ingress;
  }

  // 3. Vite env var (for custom dev/staging setups)
  const envBase = import.meta.env.VITE_API_BASE_URL;
  if (envBase) {
    return envBase;
  }

  // 4. Default: relative (same origin)
  return "";
}
