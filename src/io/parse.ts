import type { IGranularity, IPeriodicity } from './types';

export function getPeriodicityFromGranularity(granularity: IGranularity): IPeriodicity {
    return granularity === 'day' ? 'daily' : `${granularity}ly`;
}
