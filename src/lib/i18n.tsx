import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Lang = "en" | "hi";

const dict = {
  en: {
    "nav.overview": "Overview",
    "nav.progress": "Progress",
    "nav.milestones": "Milestones",
    "nav.documents": "Documents",
    "nav.queries": "Queries",
    "nav.visits": "Site Visits",
    "nav.readiness": "Readiness",
    "nav.settings": "Settings",
    "nav.today": "Today",
    "nav.upload": "Upload",
    "nav.dashboard": "Dashboard",
    "nav.projects": "Projects",
    "nav.users": "Users",
    "nav.audit": "Audit",
    "common.signOut": "Sign out",
    "common.language": "Language",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.submit": "Submit",
    "common.loading": "Loading…",
    "common.acknowledge": "Acknowledge",
    "common.acknowledged": "Acknowledged",
    "common.completed": "Completed",
    "common.inProgress": "In progress",
    "common.pending": "Pending",
    "common.status": "Status",
    "common.target": "Target",
    "common.priority": "Priority",
    "common.subject": "Subject",
    "common.message": "Message",
    "common.reply": "Reply",
    "common.requestVisit": "Request a site visit",
    "common.preferredDate": "Preferred date",
    "common.notes": "Notes",
    "common.rateProject": "Rate this project",
    "common.shareReferral": "Share a referral",
    "portal.welcome": "Welcome",
    "portal.yourProject": "Your project",
    "portal.handoverIn": "Expected handover",
    "portal.openQueries": "Open queries",
    "portal.pendingAcks": "Pending acknowledgements",
  },
  hi: {
    "nav.overview": "अवलोकन",
    "nav.progress": "प्रगति",
    "nav.milestones": "मील के पत्थर",
    "nav.documents": "दस्तावेज़",
    "nav.queries": "प्रश्न",
    "nav.visits": "साइट विज़िट",
    "nav.readiness": "तैयारी",
    "nav.settings": "सेटिंग्स",
    "nav.today": "आज",
    "nav.upload": "अपलोड",
    "nav.dashboard": "डैशबोर्ड",
    "nav.projects": "परियोजनाएँ",
    "nav.users": "उपयोगकर्ता",
    "nav.audit": "ऑडिट",
    "common.signOut": "साइन आउट",
    "common.language": "भाषा",
    "common.save": "सहेजें",
    "common.cancel": "रद्द करें",
    "common.submit": "जमा करें",
    "common.loading": "लोड हो रहा है…",
    "common.acknowledge": "स्वीकार करें",
    "common.acknowledged": "स्वीकृत",
    "common.completed": "पूर्ण",
    "common.inProgress": "चालू",
    "common.pending": "लंबित",
    "common.status": "स्थिति",
    "common.target": "लक्ष्य",
    "common.priority": "प्राथमिकता",
    "common.subject": "विषय",
    "common.message": "संदेश",
    "common.reply": "उत्तर",
    "common.requestVisit": "साइट विज़िट का अनुरोध करें",
    "common.preferredDate": "पसंदीदा तिथि",
    "common.notes": "टिप्पणियाँ",
    "common.rateProject": "इस परियोजना को रेट करें",
    "common.shareReferral": "रेफ़रल साझा करें",
    "portal.welcome": "स्वागत है",
    "portal.yourProject": "आपकी परियोजना",
    "portal.handoverIn": "अपेक्षित हैंडओवर",
    "portal.openQueries": "खुले प्रश्न",
    "portal.pendingAcks": "लंबित स्वीकृतियाँ",
  },
} as const;

type Key = keyof (typeof dict)["en"];

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: Key) => string;
}

const I18n = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "en";
    return (window.localStorage.getItem("ss.lang") as Lang) || "en";
  });

  useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem("ss.lang", lang);
  }, [lang]);

  const setLang = (l: Lang) => setLangState(l);
  const t = (k: Key) => dict[lang][k] ?? k;

  return <I18n.Provider value={{ lang, setLang, t }}>{children}</I18n.Provider>;
}

export function useI18n() {
  const v = useContext(I18n);
  if (!v) throw new Error("useI18n outside I18nProvider");
  return v;
}
