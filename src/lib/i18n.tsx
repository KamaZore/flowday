import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Lang = "en" | "km";

const LANG_KEY = "flowday-lang";

/**
 * Translation dictionary. Keys are stable identifiers; `t()` falls back to
 * English and then to the key itself so the app never renders blanks.
 */
const dict: Record<Lang, Record<string, string>> = {
  en: {
    // Nav
    "nav.today": "Today",
    "nav.inbox": "Inbox",
    "nav.tasks": "Tasks",
    "nav.projects": "Projects",
    "nav.processes": "Processes",
    "nav.calendar": "Calendar",
    "nav.habits": "Habits",
    "nav.goals": "Goals",
    "nav.progress": "Progress",
    "nav.settings": "Settings",
    "nav.more": "More",
    "app.tagline": "Your day, in flow",

    // Common
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.add": "Add",
    "common.signOut": "Sign out",
    "common.saved": "Saved",
    "lang.title": "Language",
    "lang.english": "English",
    "lang.khmer": "ភាសាខ្មែរ",

    // Theme
    "theme.light": "Light",
    "theme.dark": "Dark",
    "theme.system": "System",
    "theme.darkMode": "Dark mode",
    "theme.lightMode": "Light mode",

    // Today
    "today.greeting.night": "Good night",
    "today.greeting.morning": "Good morning",
    "today.greeting.afternoon": "Good afternoon",
    "today.greeting.evening": "Good evening",
    "today.progress": "Today's progress",
    "today.ofTasksDone": "{done} of {total} tasks done",
    "today.overdueSuffix": "{n} overdue",
    "today.overdueTasks": "{n} overdue {count, plural, one {task} other {tasks}}",
    "today.viewAllOverdue": "View all overdue →",
    "today.addTask": "Add task",
    "today.newProject": "New project",
    "today.newProcess": "New process",
    "today.newHabit": "New habit",
    "today.newGoal": "New goal",
    "today.sectionToday": "Today",
    "today.planDay": "Plan your day — add a task",
    "today.habits": "Habits",
    "today.processRoutines": "Process routines",
    "today.tomorrow": "Tomorrow",

    // Inbox
    "inbox.title": "Inbox",
    "inbox.subtitle": "Capture first, organize later",
    "inbox.placeholder": "Type anything… “Call John tomorrow”",
    "inbox.enterHint": "Enter to capture instantly",
    "inbox.empty": "Inbox zero",
    "inbox.emptySub": "Everything captured has been organized. Nice.",
    "inbox.organizedAs": "Organized as {type}",

    // Tasks
    "tasks.title": "Tasks",
    "tasks.subtitle": "Everything on your plate",
    "tasks.newTask": "New task",
    "quick.priorityHigh": "High",
    "quick.priorityMedium": "Medium",
    "quick.priorityLow": "Low",
    "filter.all": "All",
    "filter.today": "Today",
    "filter.upcoming": "Upcoming",
    "filter.overdue": "Overdue",
    "filter.completed": "Completed",
    "filter.inbox": "Inbox",
    "filter.priority": "Priority",
    "filter.project": "Project",
    "filter.tag": "Tag",

    // Settings
    "settings.title": "Settings",
    "settings.subtitle": "Make Flowday yours",
    "settings.profile": "Profile",
    "settings.name": "Your name",
    "settings.namePlaceholder": "What should we call you?",
    "settings.language": "Language / ភាសា",
    "settings.languageDesc": "Switch the app language",
    "settings.appearance": "Appearance",
    "settings.weekMonday": "Week starts Monday",
    "settings.weekMondayDesc": "Affects calendar layout",
    "settings.install": "Install app",
    "settings.installBtn": "Install Flowday",
    "settings.installNA": "Not available here",
    "settings.account": "Account",
    "settings.signedInAs": "Signed in as",
    "settings.guestNote": "You're using the app without an account. Sign in to keep this device's data separate per account.",
    "settings.signOut": "Sign out",
    "settings.data": "Your data",
    "settings.dataDesc": "Everything is stored locally on this device, separately for each account you sign in with.",
    "settings.export": "Export backup",
    "settings.import": "Import backup",
    "settings.resetDemo": "Reset demo data",
    "settings.clearAll": "Clear all data",
    "settings.about1": "Flowday v1.0 — local-first personal workflow app.",
    "settings.about2": "Goal → Project → Process → Tasks → Daily actions → Progress.",
    "settings.about3": "Works offline · data stays on your device",

    // Quick add
    "quick.title": "Quick add",
    "quick.subtitle": "Capture anything in seconds",
    "kind.task": "Task",
    "kind.project": "Project",
    "kind.process": "Process",
    "kind.habit": "Habit",
    "kind.goal": "Goal",
    "kind.note": "Note",
    "quick.taskPlaceholder": "e.g. “Call John tomorrow 3pm !high #errand”",
    "quick.noteTitle": "Note title",
    "quick.projectName": "Project name",
    "quick.habitName": "Habit name — e.g. Read 20 minutes",
    "quick.processName": "Process name — e.g. Morning Routine",
    "quick.goalName": "Goal — e.g. Run a 10k",
    "quick.writeSomething": "Write something…",
    "quick.descOptional": "Description (optional)",
    "quick.repeat": "Repeat:",
    "quick.daily": "Daily",
    "quick.weekdays": "Weekdays",
    "quick.weekly": "Weekly",
    "quick.time": "Time:",
    "quick.anytime": "Anytime",
    "quick.morning": "Morning",
    "quick.afternoon": "Afternoon",
    "quick.evening": "Evening",
    "quick.detected": "detected — press Enter to save",
    "quick.addTo": "Add {x}",
    "quick.taskAdded": "Task added",
    "quick.scheduledFor": "Scheduled for {date}",
    "quick.savedToInbox": "Saved to Inbox — organize it later",
    "quick.projectCreated": "Project created",
    "quick.processCreated": "Process created",
    "quick.processHint": "Open Processes to add steps",
    "quick.habitCreated": "Habit created",
    "quick.goalCreated": "Goal created",
    "quick.noteSaved": "Note saved",

    // Auth
    "auth.welcome": "Welcome to Flowday",
    "auth.subtitle": "Sign in or create your account — new emails are registered automatically",
    "auth.emailPlaceholder": "name@example.com",
    "auth.or": "Or",
    "auth.guest": "Continue as guest",
    "auth.checkEmail": "Check your email",
    "auth.codeSent": "We've sent a code to {email}",
    "auth.verify": "Verify code",
    "auth.verifying": "Verifying…",
    "auth.tryAgain": "Try again",
    "auth.differentEmail": "Use different email",
    "auth.localNote": "Local-first & private — your data lives on your device",

    // Landing
    "landing.badge": "Local-first · Installable · Free",
    "landing.heroA": "Your goals, your flow,",
    "landing.heroB": "every single day.",
    "landing.ctaStart": "Get started",
    "landing.ctaSignin": "Sign in",
    "landing.ctaOpen": "Open app",
    "landing.navFeatures": "Features",
    "landing.navHow": "How it works",
  },

  km: {
    // Nav
    "nav.today": "ថ្ងៃនេះ",
    "nav.inbox": "ប្រអប់ទទួល",
    "nav.tasks": "ភារកិច្ច",
    "nav.projects": "គម្រោង",
    "nav.processes": "ដំណើរការ",
    "nav.calendar": "ប្រតិទិន",
    "nav.habits": "ទម្លាប់",
    "nav.goals": "គោលដៅ",
    "nav.progress": "វឌ្ឍនភាព",
    "nav.settings": "ការកំណត់",
    "nav.more": "ច្រើនទៀត",
    "app.tagline": "ថ្ងៃរបស់អ្នក ជាលំហូរ",

    // Common
    "common.save": "រក្សាទុក",
    "common.cancel": "បោះបង់",
    "common.delete": "លុប",
    "common.add": "បន្ថែម",
    "common.signOut": "ចេញពីគណនី",
    "common.saved": "បានរក្សាទុក",
    "lang.title": "ភាសា",
    "lang.english": "English",
    "lang.khmer": "ភាសាខ្មែរ",

    // Theme
    "theme.light": "ភ្លឺ",
    "theme.dark": "ងងឹត",
    "theme.system": "ប្រព័ន្ធ",
    "theme.darkMode": "ភាពងងឹត",
    "theme.lightMode": "ភាពភ្លឺ",

    // Today
    "today.greeting.night": "រាត្រីសួស្តី",
    "today.greeting.morning": "អរុណសួស្តី",
    "today.greeting.afternoon": "ទិវាសួស្តី",
    "today.greeting.evening": "សាយណ្ហសួស្តី",
    "today.progress": "វឌ្ឍនភាពថ្ងៃនេះ",
    "today.ofTasksDone": "បានបញ្ចប់ {done} ក្នុងចំណោម {total} ភារកិច្ច",
    "today.overdueSuffix": "ហួសកំណត់ {n}",
    "today.overdueTasks": "ហួសកំណត់ {n} ភារកិច្ច",
    "today.viewAllOverdue": "មើលទាំងអស់ដែលហួសកំណត់ →",
    "today.addTask": "បន្ថែមភារកិច្ច",
    "today.newProject": "គម្រោងថ្មី",
    "today.newProcess": "ដំណើរការថ្មី",
    "today.newHabit": "ទម្លាប់ថ្មី",
    "today.newGoal": "គោលដៅថ្មី",
    "today.sectionToday": "ថ្ងៃនេះ",
    "today.planDay": "ចាប់ផ្តើមថ្ងៃរបស់អ្នក — បន្ថែមភារកិច្ច",
    "today.habits": "ទម្លាប់",
    "today.processRoutines": "ដំណើរការប្រចាំថ្ងៃ",
    "today.tomorrow": "ថ្ងៃស្អែក",

    // Inbox
    "inbox.title": "ប្រអប់ទទួល",
    "inbox.subtitle": "ចាប់យកជាមុន រៀបចំក្រោយ",
    "inbox.placeholder": "សរសេរអ្វីក៏បាន… “ហៅ John ថ្ងៃស្អែក”",
    "inbox.enterHint": "ចុច Enter ដើម្បីចាប់យកភ្លាមៗ",
    "inbox.empty": "ប្រអប់ទទួលទំនេរ",
    "inbox.emptySub": "អ្វីៗដែលបានចាប់យកត្រូវបានរៀបចំរួចរាល់ហើយ។",
    "inbox.organizedAs": "បានរៀបចំជា {type}",

    // Tasks
    "tasks.title": "ភារកិច្ច",
    "tasks.subtitle": "អ្វីៗដែលនៅសល់លើលើពិភពរបស់អ្នក",
    "tasks.newTask": "ភារកិច្ចថ្មី",
    "quick.priorityHigh": "ខ្ពស់",
    "quick.priorityMedium": "មធ្យម",
    "quick.priorityLow": "ទាប",
    "filter.all": "ទាំងអស់",
    "filter.today": "ថ្ងៃនេះ",
    "filter.upcoming": "នៅខាងមុខ",
    "filter.overdue": "ហួសកំណត់",
    "filter.completed": "បានបញ្ចប់",
    "filter.inbox": "ប្រអប់ទទួល",
    "filter.priority": "អាទិភាព",
    "filter.project": "គម្រោង",
    "filter.tag": "ស្លាក",

    // Settings
    "settings.title": "ការកំណត់",
    "settings.subtitle": "កែតម្រូវ Flowday តាមបំណងរបស់អ្នក",
    "settings.profile": "ពត៌មានផ្ទាល់ខ្លួន",
    "settings.name": "ឈ្មោះរបស់អ្នក",
    "settings.namePlaceholder": "តើយើងគួរហៅអ្នកយ៉ាងណា?",
    "settings.language": "ភាសា / Language",
    "settings.languageDesc": "ប្តូរភាសាកម្មវិធី",
    "settings.appearance": "រូបរាង",
    "settings.weekMonday": "សប្តាហ៍ចាប់ផ្តើមថ្ងៃចន្ទ",
    "settings.weekMondayDesc": "ផ្លាស់ប្តូរប្លុកប្រតិទិន",
    "settings.install": "ដំឡើងកម្មវិធី",
    "settings.installBtn": "ដំឡើង Flowday",
    "settings.installNA": "មិនអាចប្រើបានទេនៅទីនេះ",
    "settings.account": "គណនី",
    "settings.signedInAs": "បានចូលជា",
    "settings.guestNote": "អ្នកកំពុងប្រើកម្មវិធីដោយគ្មានគណនី។ ចូលគណនីដើម្បីបំបែកទិន្នន័យតាមគណនីនីមួយៗ។",
    "settings.signOut": "ចេញពីគណនី",
    "settings.data": "ទិន្នន័យរបស់អ្នក",
    "settings.dataDesc": "អ្វីៗត្រូវរក្សាទុកនៅក្នុងឧបករណ៍នេះ ដាច់ដោយឡែកតាមគណនីនីមួយៗ។",
    "settings.export": "នាំចេញការបម្រុងទុក",
    "settings.import": "នាំចូលការបម្រុងទុក",
    "settings.resetDemo": "ស្តារទិន្នន័យសាកល្បង",
    "settings.clearAll": "លុបទិន្នន័យទាំងអស់",
    "settings.about1": "Flowday v1.0 — កម្មវិធីគ្រប់គ្រងការងារផ្ទាល់ខ្លួន។",
    "settings.about2": "គោលដៅ → គម្រោង → ដំណើរការ → ភារកិច្ច → សកម្មភាពប្រចាំថ្ងៃ → វឌ្ឍនភាព។",
    "settings.about3": "ដំណើរការក្រៅបណ្តាញ · ទិន្នន័យស្ថិតនៅឧបករណ៍របស់អ្នក",

    // Quick add
    "quick.title": "បំពេញរហ័ស",
    "quick.subtitle": "ចាប់យកអ្វីមួយក្នុងរយៈពេលប៉ុន្មានវិនាទី",
    "kind.task": "ភារកិច្ច",
    "kind.project": "គម្រោង",
    "kind.process": "ដំណើរការ",
    "kind.habit": "ទម្លាប់",
    "kind.goal": "គោលដៅ",
    "kind.note": "កំណត់ត្រា",
    "quick.taskPlaceholder": "ឧ. “ហៅ John ថ្ងៃស្អែក 3pm !high #errand”",
    "quick.noteTitle": "ចំណងជើងកំណត់ត្រា",
    "quick.projectName": "ឈ្មោះគម្រោង",
    "quick.habitName": "ឈ្មោះទម្លាប់ — ឧ. អាន 20 នាទី",
    "quick.processName": "ឈ្មោះដំណើរការ — ឧ. ទម្លាប់ព្រឹក",
    "quick.goalName": "គោលដៅ — ឧ. រត់ 10km",
    "quick.writeSomething": "សរសេរអ្វីមួយ…",
    "quick.descOptional": "ការពិពណ៌នា (ស្រេចចិត្ត)",
    "quick.repeat": "ធ្វើម្តង៖",
    "quick.daily": "រាល់ថ្ងៃ",
    "quick.weekdays": "ថ្ងៃធ្វើការ",
    "quick.weekly": "រាល់សប្តាហ៍",
    "quick.time": "ពេលវេលា៖",
    "quick.anytime": "ពេលណាក៏បាន",
    "quick.morning": "ព្រឹក",
    "quick.afternoon": "ល្ងាច",
    "quick.evening": "យប់",
    "quick.detected": "រកឃើញ — ចុច Enter ដើម្បីរក្សាទុក",
    "quick.addTo": "បន្ថែម{x}",
    "quick.taskAdded": "បានបន្ថែមភារកិច្ច",
    "quick.scheduledFor": "កំណត់សម្រាប់ {date}",
    "quick.savedToInbox": "បានរក្សាទុកក្នុងប្រអប់ទទួល — រៀបចំពេលក្រោយ",
    "quick.projectCreated": "បានបង្កើតគម្រោង",
    "quick.processCreated": "បានបង្កើតដំណើរការ",
    "quick.processHint": "បើកដំណើរការ ដើម្បីបន្ថែមជំហាន",
    "quick.habitCreated": "បានបង្កើតទម្លាប់",
    "quick.goalCreated": "បានបង្កើតគោលដៅ",
    "quick.noteSaved": "បានរក្សាទុកកំណត់ត្រា",

    // Auth
    "auth.welcome": "សូមស្វាគមន៍មកកាន់ Flowday",
    "auth.subtitle": "ចូល ឬបង្កើតគណនីរបស់អ្នក — អ៊ីមែលថ្មីនឹងត្រូវបានចុះឈ្មោះស្វ័យប្រវត្តិ",
    "auth.emailPlaceholder": "name@example.com",
    "auth.or": "ឬ",
    "auth.guest": "បន្តជាភ្ញៀវ",
    "auth.checkEmail": "ពិនិត្យអ៊ីមែលរបស់អ្នក",
    "auth.codeSent": "យើងបានផ្ញើកូដទៅ {email}",
    "auth.verify": "ផ្ទៀងផ្ទាត់កូដ",
    "auth.verifying": "កំពុងផ្ទៀងផ្ទាត់…",
    "auth.tryAgain": "សាកម្តងទៀត",
    "auth.differentEmail": "ប្រើអ៊ីមែលផ្សេង",
    "auth.localNote": "ទិន្នន័យរក្សាទុកនៅឧបករណ៍របស់អ្នក — សុវត្ថិភាព",

    // Landing
    "landing.badge": "ក្នុងស្រុកជាដំបូង · ដំឡើងបាន · ឥតគិតថ្លៃ",
    "landing.heroA": "គោលដៅរបស់អ្នក លំហូររបស់អ្នក,",
    "landing.heroB": "រាល់ថ្ងៃ។",
    "landing.ctaStart": "ចាប់ផ្តើម",
    "landing.ctaSignin": "ចូល",
    "landing.ctaOpen": "បើកកម្មវិធី",
    "landing.navFeatures": "លក្ខណៈពិសេស",
    "landing.navHow": "របៀបដំណើរការ",
  },
};

type I18nValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nValue>({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
});

function readInitialLang(): Lang {
  try {
    return localStorage.getItem(LANG_KEY) === "km" ? "km" : "en";
  } catch {
    return "en";
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(readInitialLang);

  useEffect(() => {
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      // storage unavailable — keep in-memory language
    }
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang,
      t: (key, vars) => {
        let s: string = dict[lang][key] ?? dict.en[key] ?? key;
        if (vars) {
          for (const [k, v] of Object.entries(vars)) {
            s = s.split(`{${k}}`).join(String(v));
          }
        }
        return s;
      },
    }),
    [lang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
