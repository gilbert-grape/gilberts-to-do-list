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

  // 1. Home Assistant ingress path (injected by server)
  const ingress = window.__INGRESS_PATH__;
  if (ingress && ingress !== "" && ingress !== "__INGRESS_PATH__") {
    return ingress;
  }

  // 2. Vite env var (for custom dev/staging setups)
  const envBase = import.meta.env.VITE_API_BASE_URL;
  if (envBase) {
    return envBase;
  }

  // 3. Default: relative (same origin)
  return "";
}
