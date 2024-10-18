import { DEFAULT_FORMATS_PER_GRANULARITY, granularities } from "@/constants";
import { type IGranularity } from "@/io";
import { sysLocaleKey, sysWeekStartId } from "../localization";

export interface PeriodSettings {
    enabled: boolean;
    openAtStartup: boolean;

    selectedFormat: {
        id: string;
        value: string;
        filePaths: string[];
        error: string;
    }
    formats: {
        id: string;
        value: string;
        filePaths: string[];
        error: string;
    }[];
    folder: string;
    templatePath: string;
}

export interface ISettings {
    notes: Record<IGranularity, PeriodSettings>;
    /** Position of the calendar view leaf ('left' or 'right') */
    viewLeafPosition: "left" | "right";

    viewMode: "dedicated-panel" | "floating-window";

    /** Whether to show a confirmation dialog before creating a new note */
    shouldConfirmBeforeCreate: boolean;

    /** Whether to show a confirmation dialog before deleting a format on "Notes" settings tab */
    shouldConfirmBeforeDeleteFormat: boolean;

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

function getDefaultPeriodicNotesConfig(
    granularity: IGranularity,
): PeriodSettings {
    const id = window.crypto.randomUUID();
    const selectedFormat = {
        id,
        value: DEFAULT_FORMATS_PER_GRANULARITY[granularity],
        filePaths: [],
        error: "",
    }

    return Object.freeze(
        {
            enabled: false,
            openAtStartup: false,

            selectedFormat,
            formats: [selectedFormat],
            templatePath: "",
            folder: "/",
        } satisfies PeriodSettings,
    );
}

export const DEFAULT_SETTINGS: ISettings = Object.freeze({
    notes: Object.fromEntries(granularities.map(
        (
            granularity,
        ) => [granularity, getDefaultPeriodicNotesConfig(granularity)],
    )) as Record<IGranularity, PeriodSettings>,
    viewLeafPosition: "left",
    viewMode: "dedicated-panel",
    shouldConfirmBeforeCreate: true,
    shouldConfirmBeforeDeleteFormat: true,
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
