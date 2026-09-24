import { useSyncExternalStore } from "react";
import { getConfig, setConfig } from "./db";

export type CarouselSlide = {
  id: string;
  title: string;
  titleKm: string;
  subtitle: string;
  subtitleKm: string;
  imageUrl: string;
  enabled: boolean;
};

export type SiteContent = {
  logoUrl: string;
  siteName: string;
  siteNameKm: string;
  headerTitle: string;
  headerTitleKm: string;
  headerSubtitle: string;
  headerSubtitleKm: string;
  slides: CarouselSlide[];
};

const CONFIG_KEY = "site-content";

export const defaultSiteContent: SiteContent = {
  logoUrl: "",
  siteName: "Flowday",
  siteNameKm: "Flowday",
  headerTitle: "Your goals, your flow, every single day.",
  headerTitleKm: "គោលដៅរបស់អ្នក លំហូររបស់អ្នក រាល់ថ្ងៃ។",
  headerSubtitle: "Turn your plans into progress — one calm system for life, money, and business.",
  headerSubtitleKm: "បំលែងផែនការរបស់អ្នកទៅជាវឌ្ឍនភាព — ប្រព័ន្ធសម្រាលមួយសម្រាប់ជីវិត លុយ និងអាជីវកម្ម។",
  slides: [
    { id: "life", title: "Plan your day", titleKm: "រៀបចំថ្ងៃរបស់អ្នក", subtitle: "Tasks, habits, goals", subtitleKm: "កាតូង ទំនុក និងគោលដៅ", imageUrl: "", enabled: true },
    { id: "expense", title: "Know your money", titleKm: "យល់ដឹងអំពីលុយរបស់អ្នក", subtitle: "Income and expenses", subtitleKm: "ចំណូលរកបាន និងចំណាយ", imageUrl: "", enabled: true },
    { id: "business", title: "Grow your business", titleKm: "ធ្វើឱ្យអាជីវកម្មរបស់អ្នកលូតទ្បាន", subtitle: "Sales, stock and customers", subtitleKm: "ការលក់ ស្តុក និងអតិថិជន", imageUrl: "", enabled: true },
  ],
};

let content: SiteContent = defaultSiteContent;
let loaded = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const getSnapshot = () => content;

function merge(value: unknown): SiteContent {
  if (!value || typeof value !== "object") return defaultSiteContent;
  const raw = value as Partial<SiteContent>;
  return {
    ...defaultSiteContent,
    ...raw,
    slides: Array.isArray(raw.slides) && raw.slides.length > 0
      ? raw.slides.map((slide, index) => ({ ...defaultSiteContent.slides[index % 3], ...slide, id: slide.id || `slide-${index}` }))
      : defaultSiteContent.slides,
  };
}

export async function loadSiteContent(): Promise<SiteContent> {
  if (loaded) return content;
  loaded = true;
  try {
    content = merge(await getConfig(CONFIG_KEY));
  } catch {
    content = defaultSiteContent;
  }
  emit();
  return content;
}

export function useSiteContent(): SiteContent {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export async function saveSiteContent(next: SiteContent): Promise<void> {
  content = merge(next);
  loaded = true;
  emit();
  await setConfig(CONFIG_KEY, content);
}
