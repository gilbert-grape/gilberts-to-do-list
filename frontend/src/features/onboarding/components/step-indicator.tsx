import type { OnboardingStep } from "../types.ts";

interface StepIndicatorProps {
  currentStep: OnboardingStep;
}

const STEPS: OnboardingStep[] = [1, 2, 3, 4, 5];

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex justify-center gap-2" aria-label="Progress">
      {STEPS.map((step) => (
        <div
          key={step}
          className={`h-2 w-2 rounded-full ${
            step === currentStep
              ? "bg-[var(--color-primary)]"
              : "bg-[var(--color-border)]"
          }`}
          aria-current={step === currentStep ? "step" : undefined}
        />
      ))}
    </div>
  );
}
