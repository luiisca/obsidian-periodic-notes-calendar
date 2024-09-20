import { IGranularity } from "./io";

export const VIEW_TYPE = 'periodic-notes-calendar-view';
export const granularities = ['day', 'week', 'month', 'quarter', 'year'] as const;
export const granularitiesCapitalize = ['Day', 'Week', 'Month', 'Quarter', 'Year'] as const;
export const togglePeriods = ['days', 'months', 'years'] as const;

export const monthsIndexesInQuarters = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [9, 10, 11]
] as const;
export const YEARS_RANGE_SIZE = 12

export const STICKER_TAG_PREFIX = '#sticker-';

export const CALENDAR_POPOVER_ID = 'calendar-popover';
export const STICKER_POPOVER_ID = 'sticker-popover';
export const FILE_MENU_POPOVER_ID = 'file-menu-popover';

export const MODAL_CLASS = 'modal';

export const DEFAULT_DAILY_NOTE_FORMAT = "YYYY-MM-DD";
export const DEFAULT_WEEKLY_NOTE_FORMAT = "gggg-[W]ww";
export const DEFAULT_MONTHLY_NOTE_FORMAT = "YYYY-MM";
export const DEFAULT_QUARTERLY_NOTE_FORMAT = "YYYY-[Q]Q";
export const DEFAULT_YEARLY_NOTE_FORMAT = "YYYY";

export const DEFAULT_FORMATS = {
    daily: DEFAULT_DAILY_NOTE_FORMAT,
    weekly: DEFAULT_WEEKLY_NOTE_FORMAT,
    monthly: DEFAULT_MONTHLY_NOTE_FORMAT,
    quarterly: DEFAULT_QUARTERLY_NOTE_FORMAT,
    yearly: DEFAULT_YEARLY_NOTE_FORMAT,
};
export const DEFAULT_FORMATS_PER_GRANULARITY: Record<IGranularity, string> = {
    day: DEFAULT_DAILY_NOTE_FORMAT,
    week: DEFAULT_WEEKLY_NOTE_FORMAT,
    month: DEFAULT_MONTHLY_NOTE_FORMAT,
    quarter: DEFAULT_QUARTERLY_NOTE_FORMAT,
    year: DEFAULT_YEARLY_NOTE_FORMAT,
};


export const PERIODIC_NOTES_PLUGIN_ID = 'periodic-notes'
export const DAILY_NOTES_PLUGIN_ID = 'daily-notes'
export const NLDATES_PLUGIN_ID = 'nldates-obsidian'
