export type Purpose = "personal" | "work" | "hobby";

export interface OnboardingTag {
  tempId: number;
  name: string;
  color: string;
}

export type DefaultTagChoice =
  | { kind: "create-default" }
  | { kind: "existing"; tempId: number };

export type OnboardingStep = 1 | 2 | 3 | 4 | 5;
