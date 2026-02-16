import { TAG_COLORS } from "@/features/tags/colors.ts";

export const ONBOARDING_COMPLETE_KEY = "onboarding-complete";
export const USER_NAME_KEY = "user-name";

export const SUGGESTED_TAGS: Record<
  string,
  { nameKey: string; color: string }[]
> = {
  personal: [
    { nameKey: "onboarding.tags.groceries", color: TAG_COLORS[6]! },
    { nameKey: "onboarding.tags.health", color: TAG_COLORS[8]! },
    { nameKey: "onboarding.tags.finance", color: TAG_COLORS[3]! },
    { nameKey: "onboarding.tags.household", color: TAG_COLORS[5]! },
  ],
  work: [
    { nameKey: "onboarding.tags.meetings", color: TAG_COLORS[11]! },
    { nameKey: "onboarding.tags.deadlines", color: TAG_COLORS[0]! },
    { nameKey: "onboarding.tags.projects", color: TAG_COLORS[12]! },
    { nameKey: "onboarding.tags.emails", color: TAG_COLORS[9]! },
  ],
  hobby: [
    { nameKey: "onboarding.tags.reading", color: TAG_COLORS[14]! },
    { nameKey: "onboarding.tags.sports", color: TAG_COLORS[7]! },
    { nameKey: "onboarding.tags.creative", color: TAG_COLORS[15]! },
    { nameKey: "onboarding.tags.learning", color: TAG_COLORS[10]! },
  ],
};
