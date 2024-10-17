import { PeriodSettings, settingsStore } from "@/settings";
import { get } from "svelte/store";
import { type IGranularity } from "../types";
import { granularities } from "@/constants";
import { getPeriodicityFromGranularity } from "../parse";
import { capitalize } from "@/utils";
import { isWeekFormatAmbiguous } from ".";

// https://github.com/liamcain/obsidian-periodic-notes
function validateFilename(filename: string): boolean {
    const illegalRe = /[?<>\\:*|"]/g;
    const controlRe = /[\x00-\x1f\x80-\x9f]/g;
    const reservedRe = /^\.+$/;
    const windowsReservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;

    return (
        !illegalRe.test(filename) &&
        !controlRe.test(filename) &&
        !reservedRe.test(filename) &&
        !windowsReservedRe.test(filename)
    );
}

function isAmbiguousFormat(
    currentDate: moment.Moment,
    parsedDate: moment.Moment,
    format: string,
    granularity: IGranularity,
): string | null {
    const errorMessage = "Ambiguous format.";

    const containsAny = (tokens: string[]): boolean =>
        tokens.some((token) => format.includes(token));

    // Check for missing essential information based on granularity
    const missingInfo = (() => {
        if (!containsAny(["Y", "y"])) return "year (Y or y)";

        switch (granularity) {
            case "quarter":
                if (!containsAny(["Q"])) return "quarter (Q)";
                break;
            case "month":
                if (!containsAny(["M"])) return "month (M)";
                break;
            case "week":
                if (!containsAny(["w", "W"])) return "week (w or W)";
                break;
            case "day":
                if (!containsAny(["M"])) return "month (M)";
                if (!containsAny(["D"])) return "day (D)";
                break;
        }
        return null;
    })();

    if (missingInfo) {
        return `${errorMessage} Missing ${missingInfo} info. Can't uniquely identify ${granularity}.`;
    }

    switch (granularity) {
        case "year":
            if (parsedDate.year() !== currentDate.year()) {
                return `${errorMessage} It doesn't uniquely identify a year.
                    Current year: ${currentDate.year()}, Parsed year: ${parsedDate.year()}`;
            }
            break;
        case "quarter":
            if (
                parsedDate.quarter() !== currentDate.quarter() ||
                parsedDate.year() !== currentDate.year()
            ) {
                return `${errorMessage} It doesn't uniquely identify a quarter.
                    Current: Q${currentDate.quarter()} ${currentDate.year()}, Parsed: Q${parsedDate.quarter()} ${parsedDate.year()}`;
            }
            break;
        case "month":
            if (
                parsedDate.month() !== currentDate.month() ||
                parsedDate.year() !== currentDate.year()
            ) {
                return `${errorMessage} It doesn't uniquely identify a month. 
                    Current: ${currentDate.format("MMMM YYYY")}, Parsed: ${parsedDate.format("MMMM YYYY")
                    }`;
            }
            break;
        case "week":
            if (
                parsedDate.week() !== currentDate.week() ||
                parsedDate.year() !== currentDate.year()
            ) {
                return `${errorMessage} It doesn't uniquely identify a week. 
                    Current: Week ${currentDate.week()} of ${currentDate.year()}, Parsed: Week ${parsedDate.week()} of ${parsedDate.year()}`;
            }
            break;
        case "day":
            if (!parsedDate.isSame(currentDate, "day")) {
                return `${errorMessage} It doesn't uniquely identify a day. 
                    Current: ${currentDate.format("YYYY-MM-DD")}, Parsed: ${parsedDate.format("YYYY-MM-DD")
                    } `;
            }
            break;
        default:
            return errorMessage + `Unknown granularity: ${granularity} `;
    }

    return null;
}

export function addToValidFormats(
    format: string,
    granularity: IGranularity,
): void {
    let isValidFormatNew = true;
    for (const granularity of granularities) {
        const isNew = get(settingsStore).notes[granularity].formats.every((f) =>
            f.value !== format
        );

        if (!isNew) {
            isValidFormatNew = false;

            break;
        }
    }

    if (isValidFormatNew) {
        settingsStore.update((settings) => ({
            ...settings,
            notes: {
                ...settings.notes,
                [granularity]: {
                    ...settings.notes[granularity],
                    formats: [
                        ...settings.notes[granularity].formats,
                        {
                            id: window.crypto.randomUUID(),
                            value: format,
                            filePaths: [],
                            error: "",
                        },
                    ],
                } satisfies PeriodSettings,
            },
        }));
    }
}

function checkIfDuplicateFormat(
    format: string,
    granularity: IGranularity,
    id: string,
) {
    for (const g of granularities) {
        const formats = get(settingsStore).notes[g].formats;

        for (const f of formats) {
            if (f.id !== id && f.value === format) {
                return {
                    duplicate: true,
                    errorMsg: `Duplicate format ${granularity === g
                        ? ""
                        : `from ${capitalize(getPeriodicityFromGranularity(g))
                        } Notes settings`
                        }`,
                };
            }
        }
    }

    return { duplicte: false, errorMsg: "" };
}

export function validateFormat(
    format: string,
    granularity: IGranularity,
    id: string,
): string {
    let error = "";

    if (!format) {
        return error = "";
    }

    if (!validateFilename(format)) {
        return error = "Format contains illegal characters";
    }

    const currentDate = window.moment();
    const formattedDate = window.moment().format(format);
    let parsedDate = window.moment(formattedDate, format, true);
    if (granularity === 'week' && isWeekFormatAmbiguous(format)) {
        parsedDate = window.moment(
            formattedDate,
            format.replace(/M{1,4}/g, '').replace(/D{1,4}/g, ''),
            false
        );
    }

    // Check for ambiguous formats
    const ambiguityError = isAmbiguousFormat(
        currentDate,
        parsedDate,
        format,
        granularity,
    );
    if (ambiguityError) {
        return ambiguityError;
    }

    // check if the date is valid
    if (!parsedDate.isValid()) {
        return error = "Format is not valid";
    }

    // check for duplicated valid formats
    const { duplicate, errorMsg } = checkIfDuplicateFormat(
        format,
        granularity,
        id,
    );
    if (duplicate) {
        return error = errorMsg;
    }

    return error;
}
