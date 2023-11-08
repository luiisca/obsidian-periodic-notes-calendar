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
export const EMOJI_POPOVER_ID = 'emoji-popover';