import { DEFAULT_FORMATS_PER_GRANULARITY, granularities } from "@/constants";
import { type IGranularity } from "@/io";
import { sysLocaleKey, sysWeekStartId } from "../localization";
import { v4 as uuidv4 } from "uuid";

export type TFormat = {
  id: string;
  value: string;
  error: string;
  loading: boolean;
}
export type TimelineViewMode = 'expanded' | 'collapsed';
export interface IPreview {
  mainSection: "" | null,
  todoSection: string,
  destination: "default" | "below",
}
export interface PeriodSettings {
  enabled: boolean;
  openAtStartup: boolean;

  selectedFormat: TFormat;
  formats: Record<string, TFormat>;
  folder: string;
  templatePath: string;
  preview: IPreview;
}

export interface ISettings {
  periods: Record<IGranularity, PeriodSettings>;
  preview: {
    enabled: boolean;
    open: boolean;
    openNotesInPreview: boolean;
    zenMode: boolean;
    tabHeaderVisible: boolean;
    sideSplitDirection: "vertical" | "horizontal";
    centerSplitDirection: "vertical" | "horizontal";
    splitMode: boolean;
    lastPreview: {
      filepath: string;
      splitPos?: "left" | "root" | "right" | null;
    } | null;
    enabledGranularities: IGranularity[] | null;
    crrGranularity: IGranularity | null;
  };
  timeline: {
    enabled: boolean;
    /** Whether the adjacent dates will be based in the crr file granularity or if they'll always be adjacent days. */
    granularityBased: boolean;
    displayOnRestNotes: boolean;
    displayStickers: boolean;
    viewMode: TimelineViewMode;
    restViewMode: TimelineViewMode;
  };
  filepaths: Record<string, string>;
  filepathsByFormatValue: Record<string, Record<string, string> | undefined>;

  floatingMode: boolean;
  syncCalendar: boolean;

  /** Whether to show a minimal view of the calendar */
  minimalMode: boolean;
  /** Whether to always show a minimal view of the calendar when in floating mode*/
  floatingViewAlwaysMinimal: boolean;

  /** Whether to show a confirmation dialog before creating a new note */
  shouldConfirmBeforeCreate: boolean;

  /** Whether to show a confirmation dialog before deleting a format on "Notes" settings tab */
  shouldConfirmBeforeDeleteFormat: boolean;

  /** Whether to show a confirmation dialog before replacing all formats with selected one on "Notes" settings tab */
  shouldConfirmBeforeReplaceAllFormats: boolean;

  shouldConfirmBeforeMoveFile: boolean;
  shouldConfirmBeforeMoveAllFiles: boolean;
  shouldConfirmBeforeDeleteFile: boolean;
  shouldConfirmBeforeDeleteAllFiles: boolean;

  /** Starting year for the year range selector */
  yearsRangesStart: 2020;

  /** Whether to automatically preview notes on hover */
  autoHoverPreview: boolean;

  /** Whether to open the calendar popover when hovering over the ribbon icon */
  openPopoverOnRibbonHover: boolean;

  /** TODO: Default granularity for the create/replace/link date modal */
  crrNldModalGranularity: IGranularity;

  /** Locale and display settings */
  localeSettings: {
    /** Override for the default locale */
    localeOverride: string;

    /** ID of the day to start the week (0 for Sunday, 1 for Monday, etc.) */
    weekStartId: number;
  };

  /** Settings for closing popovers */
  popoversClosing: {
    /** Whether to close popovers one by one when clicking outside */
    closePopoversOneByOneOnClickOut: boolean;

    /** Whether to close popovers one by one when pressing Esc */
    closePopoversOneByOneOnEscKeydown: boolean;

    /** Close popovers when pressing Esc in the search input instead of default blur*/
    closeOnEscStickerSearchInput: boolean;
  };
}

export function getDefaultPeriodicNotesConfig(
  granularity: IGranularity,
): PeriodSettings {
  const id = uuidv4();
  const selectedFormat = {
    id,
    value: DEFAULT_FORMATS_PER_GRANULARITY[granularity],
    error: "",
    loading: false,
  }

  return {
    enabled: granularity === "day",
    openAtStartup: false,

    selectedFormat,
    formats: { [id]: selectedFormat },
    templatePath: "",
    folder: "/",
    preview: {
      mainSection: null,
      todoSection: '## TODO',
      destination: "below" as const,
    },

  } satisfies PeriodSettings
}

export const DEFAULT_SETTINGS: ISettings = Object.freeze({
  periods: Object.fromEntries(granularities.map(
    g => [g, getDefaultPeriodicNotesConfig(g)],
  )) as Record<IGranularity, PeriodSettings>,
  preview: {
    enabled: true,
    open: false,
    openNotesInPreview: false,
    zenMode: false,
    tabHeaderVisible: true,
    sideSplitDirection: "horizontal" as const,
    centerSplitDirection: "vertical" as const,
    splitMode: false,
    lastPreview: {
      filepath: "",
      splitPos: null,
    },
    enabledGranularities: null,
    crrGranularity: null,
  },
  timeline: {
    enabled: true,
    granularityBased: true,
    displayOnRestNotes: false,
    displayStickers: true,
    viewMode: 'expanded' as const,
    restViewMode: 'collapsed' as const,
  },
  filepaths: {},
  filepathsByFormatValue: {},
  floatingMode: false,
  syncCalendar: true,
  minimalMode: false,
  floatingViewAlwaysMinimal: true,
  shouldConfirmBeforeCreate: true,
  shouldConfirmBeforeDeleteFormat: true,
  shouldConfirmBeforeReplaceAllFormats: true,
  shouldConfirmBeforeMoveFile: true,
  shouldConfirmBeforeMoveAllFiles: true,
  shouldConfirmBeforeDeleteFile: true,
  shouldConfirmBeforeDeleteAllFiles: true,
  yearsRangesStart: 2020,
  autoHoverPreview: false,
  openPopoverOnRibbonHover: false,
  crrNldModalGranularity: "day",

  localeSettings: {
    localeOverride: sysLocaleKey,
    weekStartId: sysWeekStartId,
  },

  popoversClosing: {
    closePopoversOneByOneOnClickOut: false,
    closePopoversOneByOneOnEscKeydown: true,
    closeOnEscStickerSearchInput: true,
  },
});
