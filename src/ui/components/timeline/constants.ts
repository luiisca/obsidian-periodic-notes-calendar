import { IGranularity } from "@/io";
import { TimelineViewMode } from "@/settings";

export const G_MAP: Record<
    IGranularity,
    {
        group: IGranularity;
        qtt: number;
        mod: number;
        titleFormat: string;
        format: string;
    }
> = {
    day: {
        group: "week",
        qtt: 7,
        mod: 1,
        titleFormat: "ddd",
        format: "DD",
    },
    week: {
        group: "month",
        qtt: 4,
        mod: 1,
        titleFormat: "MMM",
        format: "W",
    },
    month: {
        group: "quarter",
        qtt: 3,
        mod: 1,
        titleFormat: "[Q]Q",
        format: "MM",
    },
    quarter: {
        group: "year",
        qtt: 4,
        mod: 1,
        titleFormat: "YYYY",
        format: "[Q]Q",
    },
    year: {
        group: "year",
        qtt: 5,
        mod: 5,
        titleFormat: "YYYY",
        format: "YY",
    },
};
export const VIEW_MODES: TimelineViewMode[] = ['collapsed', 'expanded'] as const
