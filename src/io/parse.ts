import type { Moment } from 'moment';
import type { IGranularity, IPeriodicity } from './types';

/**
 * noteDateUID is a way of identifying periodic notes.
 * They are prefixed with the given granularity to avoid ambiguity.
 * e.g.: "day-2022/01/01", "week-20"
 */
export function getNoteDateUID({
    date,
    granularity,
    localeAware
}: {
    date: Moment;
    granularity: IGranularity;
    localeAware?: boolean;
}): string {
    return `${granularity}-${date
        .startOf(granularity || 'day')
        .clone()
        .locale(localeAware ? window.moment.locale() : 'en')
        .format()}`;
}

export function getPeriodicityFromGranularity(granularity: IGranularity): IPeriodicity {
    return granularity === 'day' ? 'daily' : `${granularity}ly`;
}
