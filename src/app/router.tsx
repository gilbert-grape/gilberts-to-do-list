import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { AppShell } from "./app-shell.tsx";
import { ErrorBoundary } from "./error-boundary.tsx";
import { ONBOARDING_COMPLETE_KEY } from "@/features/onboarding/constants.ts";

const MainView = lazy(() =>
  import("@/features/todos").then((m) => ({ default: m.MainView })),
);
const SettingsView = lazy(() =>
  import("@/features/settings").then((m) => ({ default: m.SettingsView })),
);
const StatisticsView = lazy(() =>
  import("@/features/statistics").then((m) => ({
    default: m.StatisticsView,
  })),
);
const OnboardingView = lazy(() =>
  import("@/features/onboarding").then((m) => ({
    default: m.OnboardingView,
  })),
);

function SuspenseFallback() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-border)] border-t-[var(--color-primary)]" />
    </div>
  );
}

function isOnboardingComplete(): boolean {
  return localStorage.getItem(ONBOARDING_COMPLETE_KEY) === "true";
}

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  if (!isOnboardingComplete()) {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
}

function OnboardingRedirectGuard({ children }: { children: React.ReactNode }) {
  if (isOnboardingComplete()) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function getBasename(): string {
  const ingress = window.__INGRESS_PATH__;
  if (ingress && ingress !== "" && ingress !== "__INGRESS_PATH__") {
    return ingress;
  }
  return "/";
}

export function AppRouter() {
  return (
    <ErrorBoundary>
      <BrowserRouter basename={getBasename()}>
        <Routes>
          <Route element={<AppShell />}>
            <Route
              index
              element={
                <OnboardingGuard>
                  <Suspense fallback={<SuspenseFallback />}>
                    <MainView />
                  </Suspense>
                </OnboardingGuard>
              }
            />
            <Route
              path="settings"
              element={
                <OnboardingGuard>
                  <Suspense fallback={<SuspenseFallback />}>
                    <SettingsView />
                  </Suspense>
                </OnboardingGuard>
              }
            />
            <Route
              path="statistics"
              element={
                <OnboardingGuard>
                  <Suspense fallback={<SuspenseFallback />}>
                    <StatisticsView />
                  </Suspense>
                </OnboardingGuard>
              }
            />
            <Route
              path="onboarding"
              element={
                <OnboardingRedirectGuard>
                  <Suspense fallback={<SuspenseFallback />}>
                    <OnboardingView />
                  </Suspense>
                </OnboardingRedirectGuard>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
