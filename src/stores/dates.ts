import { YEARS_RANGE_SIZE } from '@/constants';
import { DEFAULT_SETTINGS } from '@/settings';
import type { Moment } from 'moment';
import { get, writable } from 'svelte/store';

type IRanges = `${string}-${string}`[];
function createYearsRangesStore() {
    const defaultRange =
        `${DEFAULT_SETTINGS.yearsRangesStart}-${DEFAULT_SETTINGS.yearsRangesStart + YEARS_RANGE_SIZE - 1}` as `${string}-${string}`;
    const store = writable<{
        ranges: IRanges;
        todayRange: `${string}-${string}`;
        crrRangeIndex: number;
    }>({
        ranges: [defaultRange],
        todayRange: defaultRange,
        crrRangeIndex: 0
    });

    const addNewRange = ({
        startYear,
        action
    }: {
        startYear: number;
        action: 'increment' | 'decrement';
    }) => {
        store.update((values) => {
            const newRanges = values.ranges;
            newRanges[action === 'increment' ? 'push' : 'unshift'](
                `${startYear}-${startYear + YEARS_RANGE_SIZE - 1}`
            );

            return {
                ...values,
                ranges: newRanges
            };
        });
    };
    const updateRanges = ({
        action,
        displayedDateModifier
    }: {
        action: 'decrement' | 'increment';
        displayedDateModifier?: number;
    }) => {
        const { ranges, crrRangeIndex } = get(store);
        const crrRange = ranges[crrRangeIndex];
        const [crrRangeStartYear, crrRangeEndYear] = crrRange.split('-');

        if (action === 'decrement') {
            const prevRange = ranges[crrRangeIndex - 1];

            displayedDateStore.set(
                get(todayStore).year(+crrRangeStartYear + (displayedDateModifier || -1)).startOf('year')
            );

            !prevRange &&
                addNewRange({
                    startYear: +crrRangeStartYear - YEARS_RANGE_SIZE,
                    action: 'decrement'
                });

            if (crrRangeIndex > 0) {
                updateCrrRangeIndex({ modifier: -1 });
            }
        }

        if (action === 'increment') {
            const nextRange = ranges[crrRangeIndex + 1];

            displayedDateStore.set(get(todayStore).year(+crrRangeEndYear + 1).startOf('year'));

            !nextRange && addNewRange({ startYear: +crrRangeEndYear + 1, action: 'increment' });
            updateCrrRangeIndex({ modifier: +1 });
        }
    };
    const updateCrrRangeIndex = ({ modifier }: { modifier: number }) => {
        store.update((values) => ({
            ...values,
            crrRangeIndex: values.crrRangeIndex + modifier
        }));
    };
    const selectOrCreateRanges = () => {
        const { ranges, crrRangeIndex, todayRange } = get(store);
        const crrDisplayedYear = get(displayedDateStore).year();
        const todayYear = window.moment().clone().year();
        console.log('selectOrCreateRnages(), todayRange: ', todayRange);

        const firstRange = ranges[0];
        const lastRange = ranges[ranges.length - 1];
        const firstRangeStartYear = firstRange.split('-')[0];
        const lastRangeEndYear = lastRange.split('-')[1];

        const newRanges = [...ranges];
        let newCrrRangeIndex = crrRangeIndex;
        let newTodayRange = todayRange;

        if (+firstRangeStartYear > crrDisplayedYear) {
            // push new ranges at the start of ranges
            let newFirstRangeStartYear = +firstRangeStartYear;

            while (+newFirstRangeStartYear > crrDisplayedYear) {
                newRanges.unshift(
                    `${newFirstRangeStartYear - YEARS_RANGE_SIZE}-${newFirstRangeStartYear - 1}`
                );

                newFirstRangeStartYear -= YEARS_RANGE_SIZE;
            }

            newCrrRangeIndex = 0;
        }

        // push new ranges at the end of ranges
        if (+lastRangeEndYear < crrDisplayedYear) {
            let newLastRangeEndYear = +lastRangeEndYear;

            while (+newLastRangeEndYear < crrDisplayedYear) {
                newRanges.push(`${+newLastRangeEndYear + 1}-${newLastRangeEndYear + YEARS_RANGE_SIZE}`);

                newLastRangeEndYear += YEARS_RANGE_SIZE;
            }

            newCrrRangeIndex = newRanges.length - 1;
        }

        // search for range containing crrDisplayedYear and set it as current range
        if (crrDisplayedYear >= +firstRangeStartYear && crrDisplayedYear <= +lastRangeEndYear) {
            for (const [i, range] of newRanges.entries()) {
                const [start, end] = range.split('-');

                if (crrDisplayedYear >= +start && crrDisplayedYear <= +end) {
                    newCrrRangeIndex = i;

                    break;
                }
            }
        }

        // update todayRange if it doesnt include todayYear anymore
        const [todayRangeStartYear, todayRangeEndYear] = todayRange.split('-');
        if (!(todayYear >= +todayRangeStartYear && todayYear <= +todayRangeEndYear)) {
            for (const [_, range] of newRanges.entries()) {
                const [start, end] = range.split('-');

                if (todayYear >= +start && todayYear <= +end) {
                    newTodayRange = range;

                    break;
                }
            }
        }

        // update store
        store.update((values) => ({
            ...values,
            ranges: newRanges,
            crrRangeIndex: newCrrRangeIndex,
            todayRange: newTodayRange
        }));
    };

    return {
        addNewRange,
        updateRanges,
        updateCrrRangeIndex,
        selectOrCreateRanges,
        ...store
    };
}

const todayStore = writable<Moment>(window.moment());
const displayedDateStore = writable<Moment>(window.moment());
const yearsRanges = createYearsRangesStore();

export { displayedDateStore, todayStore, yearsRanges };
