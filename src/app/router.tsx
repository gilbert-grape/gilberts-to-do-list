import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { AppShell } from "./app-shell.tsx";
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
  return null;
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

export function AppRouter() {
  return (
    <BrowserRouter>
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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
