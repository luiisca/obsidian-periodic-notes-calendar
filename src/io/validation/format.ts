import { PeriodSettings, settingsStore } from "@/settings";
import { get } from "svelte/store";
import { type IGranularity } from "../types";
import { granularities } from "@/constants";
import { getPeriodicityFromGranularity } from "../parse";
import { capitalize } from "@/utils";

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
    granularity: IGranularity,
): string | null {
    const errorMessage = "Ambiguous format.";

    // no need to worry about using a, lets say daily format in a monthly format,
    // it may seem invalid but as long as it's not a dup of any existing `validFormat` it's fine,
    // it should be up to the user to determine if that is a valid format or not
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
                    errorMsg: `Duplicate format ${granularity === g ? '' : `from ${capitalize(getPeriodicityFromGranularity(g))} Notes settings`}`
                }
            }
        }
    }

    return { duplicte: false, errorMsg: '' }
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
    const parsedDate = window.moment(formattedDate, format, true);
    if (!parsedDate.isValid()) {
        return error = "Format is not valid";
    }

    // Check for ambiguous formats
    const ambiguityError = isAmbiguousFormat(
        currentDate,
        parsedDate,
        granularity,
    );
    if (ambiguityError) {
        return error = ambiguityError;
    }

    // check for duplicated valid formats
    const { duplicate, errorMsg } = checkIfDuplicateFormat(format, granularity, id)
    if (duplicate) {
        return error = errorMsg;
    }

    return error;
}
