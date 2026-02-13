import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import de from "@/shared/locales/de/translation.json";
import en from "@/shared/locales/en/translation.json";

function detectLanguage(): string {
  const saved = localStorage.getItem("language");
  if (saved) return saved;
  const browserLang = navigator.language;
  return browserLang.startsWith("de") ? "de" : "en";
}

void i18n.use(initReactI18next).init({
  resources: {
    de: { translation: de },
    en: { translation: en },
  },
  lng: detectLanguage(),
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
