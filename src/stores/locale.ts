import { defaultWeekdays, defaultWeekdaysShort } from '@/localization';
import { get, writable } from 'svelte/store';
import { settingsStore } from '@/settings';
import { displayedDateStore } from './dates';

type TLocaleData = {
    weekdays: string[];
    weekdaysShort: string[];
};

/**
    * used in <Calendar />'s header
*/
export const localeDataStore = writable<TLocaleData>({
    weekdays: defaultWeekdays,
    weekdaysShort: defaultWeekdaysShort
});
export const localeSwitched = writable({ modified: Math.random() })

function setMomentLocale(localeKey: string) {
    window.moment.locale(localeKey);
}

function updateLocaleKeySetting(localeKey: string) {
    settingsStore.update((settings) => ({
        ...settings,
        localeSettings: {
            ...settings.localeSettings,
            localeOverride: localeKey
        }
    }))
}
export function updateWeekStartSetting(weekStartId: number = window.moment.localeData().firstDayOfWeek()) {
    settingsStore.update((settings) => ({
        ...settings,
        localeSettings: {
            ...settings.localeSettings,
            weekStartId
        }
    }))

    updateWeekdays()
}

export function updateWeekdays() {
    const weekStartId = get(settingsStore).localeSettings.weekStartId;

    const localizedWeekdays = window.moment.localeData().weekdays();
    const localizedWeekdaysShort = window.moment.localeData().weekdaysMin();
    const weekdays = [
        ...localizedWeekdays.slice(weekStartId),
        ...localizedWeekdays.slice(0, weekStartId)
    ];
    const weekdaysShort = [
        ...localizedWeekdaysShort.slice(weekStartId),
        ...localizedWeekdaysShort.slice(0, weekStartId)
    ];

    localeDataStore.set({
        weekdays,
        weekdaysShort
    });
}

export function switchLocale(localeKey: string) {
    setMomentLocale(localeKey);
    updateLocaleKeySetting(localeKey);
    updateWeekStartSetting();

    // trigger <Calendar /> rerender to use new locale
    displayedDateStore.set(get(displayedDateStore).locale(localeKey));
    // force rerender on <Timeline />, same as displayedDateStore.set but avoids unnecessary <Timeline /> rerenders
    localeSwitched.set({ modified: Math.random() });
}

export function setupLocale() {
    setMomentLocale(get(settingsStore).localeSettings.localeOverride);
    updateWeekdays();
}
