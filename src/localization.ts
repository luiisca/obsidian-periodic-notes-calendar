import type { WeekSpec } from "moment";

declare global {
  interface Window {
    _bundledLocaleWeekSpec: WeekSpec;
  }
}

export type ILocaleOverride = "system-default" | string;
export type IWeekStartOption =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "locale";

const langToMomentLocale = {
  en: "en-gb",
  zh: "zh-cn",
  "zh-TW": "zh-tw",
  ru: "ru",
  ko: "ko",
  it: "it",
  id: "id",
  ro: "ro",
  "pt-BR": "pt-br",
  cz: "cs",
  da: "da",
  de: "de",
  es: "es",
  fr: "fr",
  no: "nn",
  pl: "pl",
  pt: "pt",
  tr: "tr",
  hi: "hi",
  nl: "nl",
  ar: "ar",
  ja: "ja",
} as Record<string, string>;

const weekdays = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

function overrideGlobalMomentWeekStart(weekStart: IWeekStartOption): void {
  const { moment } = window;
  const currentLocale = moment.locale();

  console.log('Overriding week start!', moment.localeData())
  if (weekStart === "locale") {
    moment.updateLocale(currentLocale, {
      week: moment.localeData()._defaultWeek,
    });
  } else {
    moment.updateLocale(currentLocale, {
      week: {
        dow: weekdays.indexOf(weekStart) || 0,
      },
    });
  }
}

/**
 * Sets the locale used by the calendar. This allows the calendar to
 * default to the user's locale (e.g. Start Week on Sunday/Monday/Friday)
 *
 * @param localeOverride locale string (e.g. "en-US")
 */
export function configureGlobalMomentLocale(
  localeOverride: ILocaleOverride = "system-default",
  weekStart: IWeekStartOption = "locale"
): string {
  const {moment} = window;
  const obsidianLang = localStorage.getItem("language") || "en";
  const systemLang = navigator.language?.toLowerCase();

  let momentLocale = langToMomentLocale[obsidianLang];

  if (localeOverride !== "system-default") {
    momentLocale = localeOverride;
  } else if (systemLang.startsWith(obsidianLang)) {
    // If the system locale is more specific (en-gb vs en), use the system locale.
    momentLocale = systemLang;
  }

  const currentLocale = moment.locale(momentLocale);
  
  // backup default week start number 
  if (!moment.localeData()._defaultWeek) {
      moment.updateLocale(momentLocale, {
        defaultWeek: moment.localeData()._week,
      })
  }
  console.debug(
    `[Calendar] Trying to switch Moment.js global locale to ${momentLocale}, got ${currentLocale}`
  );

  overrideGlobalMomentWeekStart(weekStart);

  return currentLocale;
}