import { useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useOnboardingStore } from "../store.ts";
import {
  SUGGESTED_TAGS,
  ONBOARDING_COMPLETE_KEY,
  USER_NAME_KEY,
} from "../constants.ts";
import { TAG_COLORS } from "@/features/tags/colors.ts";
import { StepIndicator } from "./step-indicator.tsx";
import { NameStep } from "./name-step.tsx";
import { PurposeStep } from "./purpose-step.tsx";
import { TagsStep } from "./tags-step.tsx";
import { DefaultTagStep } from "./default-tag-step.tsx";
import { SummaryStep } from "./summary-step.tsx";
import type { OnboardingTag } from "../types.ts";
import { AppDatabase } from "@/services/storage/indexeddb/db.ts";
import { IndexedDBAdapter } from "@/services/storage/indexeddb/indexeddb-adapter.ts";
import { useTagStore, setStorageAdapter } from "@/features/tags/store.ts";
import { setTodoStorageAdapter } from "@/features/todos/store.ts";

export function OnboardingView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isCompleting, setIsCompleting] = useState(false);

  const store = useOnboardingStore();

  const goToStep2 = () => store.setStep(2);
  const goToStep1 = () => store.setStep(1);

  const goToStep3 = () => {
    // Generate suggested tags if none yet
    if (store.tags.length === 0) {
      const seen = new Set<string>();
      const suggested: OnboardingTag[] = [];
      let tempId = store.nextTempId;

      for (const purpose of store.purposes) {
        const tagDefs = SUGGESTED_TAGS[purpose];
        if (!tagDefs) continue;
        for (const def of tagDefs) {
          const name = t(def.nameKey);
          if (seen.has(name)) continue;
          seen.add(name);
          suggested.push({ tempId, name, color: def.color });
          tempId++;
        }
      }

      if (suggested.length > 0) {
        store.setTags(suggested);
      }
    }
    store.setStep(3);
  };

  const goToStep2FromTags = () => store.setStep(2);
  const goToStep4 = () => store.setStep(4);
  const goToStep3FromDefault = () => store.setStep(3);
  const goToStep5 = () => store.setStep(5);
  const goToStep4FromSummary = () => store.setStep(4);

  const handleComplete = async () => {
    if (isCompleting) return;
    setIsCompleting(true);

    try {
      const db = new AppDatabase();
      const adapter = new IndexedDBAdapter(db);
      setStorageAdapter(adapter);
      setTodoStorageAdapter(adapter);

      const tempIdToRealId = new Map<number, string>();

      // Create all user tags
      for (const tag of store.tags) {
        await useTagStore.getState().createTag({
          name: tag.name,
          color: tag.color,
          isDefault: false,
          parentId: null,
        });
        const tags = useTagStore.getState().tags;
        const created = tags[tags.length - 1];
        if (created) {
          tempIdToRealId.set(tag.tempId, created.id);
        }
      }

      // Handle default tag
      if (store.defaultTagChoice.kind === "create-default") {
        await useTagStore.getState().createTag({
          name: t("onboarding.defaultTagOption"),
          color: TAG_COLORS[TAG_COLORS.length - 1]!,
          isDefault: false,
          parentId: null,
        });
        const tags = useTagStore.getState().tags;
        const defaultTag = tags[tags.length - 1];
        if (defaultTag) {
          await useTagStore.getState().setDefaultTag(defaultTag.id);
        }
      } else {
        const realId = tempIdToRealId.get(store.defaultTagChoice.tempId);
        if (realId) {
          await useTagStore.getState().setDefaultTag(realId);
        }
      }

      localStorage.setItem(USER_NAME_KEY, store.name);
      localStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
      store.reset();
      void navigate("/");
    } catch {
      setIsCompleting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 p-4">
      <StepIndicator currentStep={store.step} />

      {store.step === 1 && (
        <NameStep
          name={store.name}
          onNameChange={store.setName}
          onNext={goToStep2}
        />
      )}

      {store.step === 2 && (
        <PurposeStep
          purposes={store.purposes}
          onTogglePurpose={store.togglePurpose}
          onNext={goToStep3}
          onBack={goToStep1}
        />
      )}

      {store.step === 3 && (
        <TagsStep
          tags={store.tags}
          onAddTag={store.addTag}
          onRemoveTag={store.removeTag}
          onRenameTag={store.renameTag}
          onNext={goToStep4}
          onBack={goToStep2FromTags}
        />
      )}

      {store.step === 4 && (
        <DefaultTagStep
          tags={store.tags}
          defaultTagChoice={store.defaultTagChoice}
          onSetDefaultTagChoice={store.setDefaultTagChoice}
          onNext={goToStep5}
          onBack={goToStep3FromDefault}
        />
      )}

      {store.step === 5 && (
        <SummaryStep
          name={store.name}
          tags={store.tags}
          defaultTagChoice={store.defaultTagChoice}
          isCompleting={isCompleting}
          onComplete={() => void handleComplete()}
          onBack={goToStep4FromSummary}
        />
      )}
    </div>
  );
}
