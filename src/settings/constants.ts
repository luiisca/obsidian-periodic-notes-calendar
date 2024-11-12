import { DEFAULT_FORMATS_PER_GRANULARITY, granularities } from "@/constants";
import { type IGranularity } from "@/io";
import { sysLocaleKey, sysWeekStartId } from "../localization";

export type TFormat = {
    id: string;
    value: string;
    error: string;
    loading: boolean;
}
export interface PeriodSettings {
    enabled: boolean;
    openAtStartup: boolean;

    selectedFormat: TFormat;
    formats: Record<string, TFormat>;
    folder: string;
    templatePath: string;
}

export interface ISettings {
    periods: Record<IGranularity, PeriodSettings>;
    filepaths: Record<string, string>;
    filepathsByFormatValue: Record<string, Record<string, string> | undefined>;
    /** Position of the calendar view leaf ('left' or 'right') */
    viewLeafPosition: "left" | "right";

    floatingMode: boolean;

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
        /** Whether to show week numbers in the calendar */
        showWeekNums: boolean;

        /** Whether to show quarter numbers in the calendar */
        showQuarterNums: boolean;

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

    /** Whether to allow switching locales from the Command Palette */
    allowLocalesSwitchFromCommandPalette: boolean;

    /** Format settings for different periodicities */
    // formats: IFormatsSettings;
}

export function getDefaultPeriodicNotesConfig(
    granularity: IGranularity,
): PeriodSettings {
    const id = window.crypto.randomUUID();
    const selectedFormat = {
        id,
        value: DEFAULT_FORMATS_PER_GRANULARITY[granularity],
        error: "",
        loading: false,
    }

    return {
        enabled: false,
        openAtStartup: false,

        selectedFormat,
        formats: { [id]: selectedFormat },
        templatePath: "",
        folder: "/",
    } satisfies PeriodSettings
}

export const DEFAULT_SETTINGS: ISettings = Object.freeze({
    periods: Object.fromEntries(granularities.map(
        g => [g, getDefaultPeriodicNotesConfig(g)],
    )) as Record<IGranularity, PeriodSettings>,
    filepaths: {},
    filepathsByFormatValue: {},
    viewLeafPosition: "right",
    floatingMode: false,
    minimalMode: false,
    floatingViewAlwaysMinimal: true,
    shouldConfirmBeforeCreate: true,
    shouldConfirmBeforeDeleteFormat: true,
    shouldConfirmBeforeReplaceAllFormats: true,
    shouldConfirmBeforeDeleteFile: true,
    shouldConfirmBeforeDeleteAllFiles: true,
    yearsRangesStart: 2020,
    autoHoverPreview: false,
    openPopoverOnRibbonHover: false,
    crrNldModalGranularity: "day",

    localeSettings: {
        showWeekNums: false,
        showQuarterNums: false,
        localeOverride: sysLocaleKey,
        weekStartId: sysWeekStartId,
    },

    popoversClosing: {
        closePopoversOneByOneOnClickOut: false,
        closePopoversOneByOneOnEscKeydown: true,
        closeOnEscStickerSearchInput: true,
    },

    allowLocalesSwitchFromCommandPalette: false,
});
