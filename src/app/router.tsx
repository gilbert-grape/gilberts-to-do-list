import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router";
import { AppShell } from "./app-shell.tsx";

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

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route
            index
            element={
              <Suspense fallback={<SuspenseFallback />}>
                <MainView />
              </Suspense>
            }
          />
          <Route
            path="settings"
            element={
              <Suspense fallback={<SuspenseFallback />}>
                <SettingsView />
              </Suspense>
            }
          />
          <Route
            path="statistics"
            element={
              <Suspense fallback={<SuspenseFallback />}>
                <StatisticsView />
              </Suspense>
            }
          />
          <Route
            path="onboarding"
            element={
              <Suspense fallback={<SuspenseFallback />}>
                <OnboardingView />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
