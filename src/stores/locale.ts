import { defaultWeekdays, defaultWeekdaysShort } from '@/localization';
import { get, writable } from 'svelte/store';
import { displayedDateStore, pluginClassStore } from '.';
import { settingsStore } from '@/settings';

type TLocaleData = {
    weekdays: string[];
    weekdaysShort: string[];
};
const localeDataStore = writable<TLocaleData>({
    weekdays: defaultWeekdays,
    weekdaysShort: defaultWeekdaysShort
});

function updateLocale(localeKey: string) {
    window.moment.locale(localeKey);

    // update settings
    get(pluginClassStore).saveSettings((settings) => ({
        localeSettings: {
            ...settings.localeSettings,
            localeOverride: localeKey
        }
    }));

    // update UI
    displayedDateStore.set(window.moment());
}
function updateWeekStart(weekStartId: number = window.moment.localeData().firstDayOfWeek()) {
    // update settings
    get(pluginClassStore).saveSettings((settings) => ({
        localeSettings: {
            ...settings.localeSettings,
            weekStartId
        }
    }));

    // update UI
    displayedDateStore.set(window.moment());
}
function updateWeekdays() {
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

    // update UI
    localeDataStore.update((data) => ({
        ...data,
        weekdays,
        weekdaysShort
    }));
    displayedDateStore.set(window.moment());
}
function setupLocale() {
    window.moment.locale(get(settingsStore).localeSettings.localeOverride);
    updateWeekdays();
}

export { localeDataStore, updateLocale, updateWeekStart, updateWeekdays, setupLocale };
