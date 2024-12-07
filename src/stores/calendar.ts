import { IGranularity } from "@/io";
import { ISettings, settingsStore } from "@/settings";
import { get, writable } from "svelte/store";

export const periodTabs = ['day', 'month', 'year'] as const;
export const crrTabStore = writable<(typeof periodTabs)[number]>('day');

export function getEnabledPeriods(periods?: ISettings["periods"]) {
    let tabs: string[] = [];
    const enabledPeriods = Object.entries(periods || get(settingsStore).periods).reduce(
        (acc, [g, s]) => {
            if (g === "day" || g === "month" || g === "year") {
                if (s.enabled) {
                    tabs.push(g);
                }
            }
            return {
                ...acc,
                [g]: s.enabled,
            };
        },
        {},
    ) as Record<IGranularity, boolean>

    return {
        tabs,
        enabledPeriods
    } as unknown as {
        tabs: typeof periodTabs,
        enabledPeriods: Record<IGranularity, boolean>
    };
}
