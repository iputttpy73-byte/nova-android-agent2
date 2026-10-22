import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type Locale = "ar-YE" | "en-US";

type TranslationKey = keyof typeof translations["ar-YE"];

const translations = {
  "ar-YE": {
    home: "الرئيسية",
    chat: "المحادثة",
    tasks: "المهام",
    logs: "السجل",
    settings: "الإعدادات",
    personalAgent: "وكيل أندرويد الشخصي",
    goodEvening: "حياك الله في نوفا",
    homeSubtitle: "مركزك الهادئ للتحكم بالوكيل، جاهز متى ما احتجته.",
    agentFoundation: "أساس الوكيل",
    homeCardTitle: "مركز تحكم بسيط لأهدافك.",
    homeCardBody: "النسخة الحالية تجهز الأساس الآمن. ذكاء الوكيل وتنفيذ أوامر أندرويد يحتاجان تفعيل الصلاحيات والربط.",
    systemStatus: "حالة النظام",
    notConnected: "غير متصل",
    ready: "جاهز",
    androidEnvironment: "بيئة أندرويد",
    androidEnvironmentBody: "اربط بيئة أندرويد معتمدة من الإعدادات عند تفعيلها.",
    recentActivity: "آخر النشاطات",
    noRuns: "ما في عمليات للوكيل بعد",
    noRunsBody: "لما يبدأ تشغيل الوكيل، بتظهر هنا العمليات التي تم التحقق منها.",
    conversation: "المحادثة",
    chatTitle: "تكلم مع وكيلك",
    chatSubtitle: "اكتب هدفك وراجع الخطة قبل ما ينفذ الوكيل أي شيء.",
    supervised: "التشغيل تحت إشرافك",
    supervisedBody: "بتكون الخطط والصلاحيات ونتيجة التحقق واضحة لك قبل التنفيذ.",
    aiNotConnected: "الذكاء الاصطناعي ما اتصل بعد",
    chatReadyBody: "واجهة المحادثة جاهزة، وربط مزود الذكاء الاصطناعي يحتاج إكمال الإعداد.",
    workspace: "مساحة العمل",
    tasksTitle: "المهام",
    tasksSubtitle: "تابع الأهداف والخطط والنتائج التي تم التحقق منها في مكان واحد.",
    noTasks: "ما في مهام لعرضها",
    tasksBody: "دورة حياة المهمة والتنفيذ تحتاج تفعيل بقية مكونات الوكيل.",
    observability: "المتابعة",
    logsTitle: "السجل",
    logsSubtitle: "سجل واضح لقرارات الوكيل وأحداث بيئة أندرويد.",
    noEvents: "ما في أحداث مسجلة",
    logsBody: "بتظهر سجلات القرارات والتدقيق هنا بعد تشغيل الوكيل.",
    controlCenter: "مركز التحكم",
    settingsTitle: "الإعدادات",
    settingsSubtitle: "اضبط شكل التطبيق ولغته الآن، والصلاحيات والربط من المراحل التالية.",
    appearance: "المظهر",
    colorTheme: "ألوان التطبيق",
    colorThemeBody: "اختار المظهر المريح لك.",
    light: "فاتح",
    dark: "داكن",
    language: "لغة التطبيق",
    languageBody: "اللغة الحالية مضبوطة على العربية اليمنية.",
    yemeniArabic: "العربية اليمنية",
    english: "English",
    foundationStatus: "حالة الأساس",
    aiProvider: "مزود الذكاء الاصطناعي",
    androidAccess: "صلاحية أندرويد",
    memory: "الذاكرة",
    notConfigured: "غير مضبوط",
    notImplemented: "لم تُفعّل بعد",
  },
  "en-US": {
    home: "Home",
    chat: "Chat",
    tasks: "Tasks",
    logs: "Logs",
    settings: "Settings",
    personalAgent: "Personal Android Agent",
    goodEvening: "Welcome to NOVA",
    homeSubtitle: "A calm control center for your agent, ready when you are.",
    agentFoundation: "Agent foundation",
    homeCardTitle: "A simple control center for your goals.",
    homeCardBody: "This build prepares the secure foundation. Agent intelligence and Android actions require permissions and provider setup.",
    systemStatus: "System status",
    notConnected: "Not connected",
    ready: "Ready",
    androidEnvironment: "Android environment",
    androidEnvironmentBody: "Connect an approved Android environment from Settings when enabled.",
    recentActivity: "Recent activity",
    noRuns: "No agent runs yet",
    noRunsBody: "Verified runs will appear here when the agent starts operating.",
    conversation: "Conversation",
    chatTitle: "Chat with your agent",
    chatSubtitle: "Describe a goal and review the plan before anything runs.",
    supervised: "Supervised by design",
    supervisedBody: "Plans, permissions, and verification stay visible before execution.",
    aiNotConnected: "AI is not connected yet",
    chatReadyBody: "The chat surface is ready. AI provider setup is the next integration step.",
    workspace: "Workspace",
    tasksTitle: "Tasks",
    tasksSubtitle: "Track goals, plans, and verified outcomes in one place.",
    noTasks: "No tasks to show",
    tasksBody: "Task lifecycle and execution require the remaining agent components.",
    observability: "Observability",
    logsTitle: "Logs",
    logsSubtitle: "A transparent record of agent decisions and Android environment events.",
    noEvents: "No events recorded",
    logsBody: "Decision and audit events will appear here after the agent starts running.",
    controlCenter: "Control center",
    settingsTitle: "Settings",
    settingsSubtitle: "Shape the app and language now; permissions and integrations come next.",
    appearance: "Appearance",
    colorTheme: "Color theme",
    colorThemeBody: "Choose a comfortable workspace appearance.",
    light: "Light",
    dark: "Dark",
    language: "App language",
    languageBody: "The current language is Yemeni Arabic.",
    yemeniArabic: "Yemeni Arabic",
    english: "English",
    foundationStatus: "Foundation status",
    aiProvider: "AI provider",
    androidAccess: "Android access",
    memory: "Memory",
    notConfigured: "Not configured",
    notImplemented: "Not implemented",
  },
} as const;

interface I18nContextValue {
  locale: Locale;
  isRTL: boolean;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("ar-YE");
  const value = useMemo<I18nContextValue>(() => ({
    locale,
    isRTL: locale === "ar-YE",
    setLocale,
    t: (key) => translations[locale][key],
  }), [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}
