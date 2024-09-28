import { IGranularity } from "@/io";
import { sysLocaleKey, sysWeekStartId } from '../localization';
import { DEFAULT_FORMATS, granularities } from "@/constants";

export interface PeriodSettings {
    enabled: boolean;
    openAtStartup: boolean;

    format: string;
    folder: string;
    templatePath?: string;
}

export interface ISettings {
    notes: Record<IGranularity, PeriodSettings>;
    /** Position of the calendar view leaf ('Left' or 'Right') */
    viewLeafPosition: 'Left' | 'Right';

    /** Whether the calendar view should be displayed in a leaf */
    leafViewEnabled: boolean;

    /** Whether to show a confirmation dialog before creating a new note */
    shouldConfirmBeforeCreate: boolean;

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

    /** Valid date formats for each granularity */
    validFormats: Record<IGranularity, string[]>;

    /** Whether to allow switching locales from the Command Palette */
    allowLocalesSwitchFromCommandPalette: boolean;

    /** Format settings for different periodicities */
    // formats: IFormatsSettings;
}

const DEFAULT_PERIODIC_CONFIG: PeriodSettings = Object.freeze({
    enabled: false,
    openAtStartup: false,

    format: "",
    templatePath: "",
    folder: "",
});

export const DEFAULT_SETTINGS: ISettings = Object.freeze({
    notes: Object.fromEntries(granularities.map(
        (granularity) => [granularity, DEFAULT_PERIODIC_CONFIG])
    ) as Record<IGranularity, PeriodSettings>,
    viewLeafPosition: 'Left',
    leafViewEnabled: false,
    shouldConfirmBeforeCreate: true,
    yearsRangesStart: 2020,
    autoHoverPreview: false,
    openPopoverOnRibbonHover: false,
    crrNldModalGranularity: 'day',

    localeSettings: {
        showWeekNums: false,
        showQuarterNums: false,
        localeOverride: sysLocaleKey,
        weekStartId: sysWeekStartId
    },

    popoversClosing: {
        closePopoversOneByOneOnClickOut: false,
        closePopoversOneByOneOnEscKeydown: true,
        closeOnEscStickerSearchInput: true
    },

    validFormats: {
        day: [DEFAULT_FORMATS.daily],
        week: [DEFAULT_FORMATS.weekly],
        month: [DEFAULT_FORMATS.monthly],
        quarter: [DEFAULT_FORMATS.quarterly],
        year: [DEFAULT_FORMATS.yearly],
    },
    allowLocalesSwitchFromCommandPalette: false,
});
