import { create } from "zustand";
import type {
  OnboardingStep,
  Purpose,
  OnboardingTag,
  DefaultTagChoice,
} from "./types.ts";

export interface OnboardingState {
  step: OnboardingStep;
  name: string;
  purposes: Purpose[];
  tags: OnboardingTag[];
  defaultTagChoice: DefaultTagChoice;
  nextTempId: number;

  setStep: (step: OnboardingStep) => void;
  setName: (name: string) => void;
  togglePurpose: (purpose: Purpose) => void;
  setTags: (tags: OnboardingTag[]) => void;
  addTag: (name: string, color: string) => void;
  removeTag: (tempId: number) => void;
  renameTag: (tempId: number, name: string) => void;
  setDefaultTagChoice: (choice: DefaultTagChoice) => void;
  reset: () => void;
}

const initialState = {
  step: 1 as OnboardingStep,
  name: "",
  purposes: [] as Purpose[],
  tags: [] as OnboardingTag[],
  defaultTagChoice: { kind: "create-default" } as DefaultTagChoice,
  nextTempId: 1,
};

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  ...initialState,

  setStep: (step) => set({ step }),

  setName: (name) => set({ name }),

  togglePurpose: (purpose) => {
    const { purposes } = get();
    if (purposes.includes(purpose)) {
      set({ purposes: purposes.filter((p) => p !== purpose) });
    } else {
      set({ purposes: [...purposes, purpose] });
    }
  },

  setTags: (tags) => {
    const maxId = tags.reduce((max, t) => Math.max(max, t.tempId), 0);
    set({ tags, nextTempId: maxId + 1 });
  },

  addTag: (name, color) => {
    const { tags, nextTempId } = get();
    set({
      tags: [...tags, { tempId: nextTempId, name, color }],
      nextTempId: nextTempId + 1,
    });
  },

  removeTag: (tempId) => {
    const { tags, defaultTagChoice } = get();
    const newTags = tags.filter((t) => t.tempId !== tempId);

    const resetDefault =
      defaultTagChoice.kind === "existing" &&
      defaultTagChoice.tempId === tempId;

    set({
      tags: newTags,
      ...(resetDefault ? { defaultTagChoice: { kind: "create-default" } } : {}),
    });
  },

  renameTag: (tempId, name) => {
    set((state) => ({
      tags: state.tags.map((t) => (t.tempId === tempId ? { ...t, name } : t)),
    }));
  },

  setDefaultTagChoice: (choice) => set({ defaultTagChoice: choice }),

  reset: () => set(initialState),
}));
