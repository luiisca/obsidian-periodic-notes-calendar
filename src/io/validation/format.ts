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
    value: string,
    currentDate: moment.Moment,
    parsedDate: moment.Moment,
    granularity: IGranularity,
): string | null {
    const errorMessage = "Ambiguous format.";

    const isTokenEffective = (token: string) => {
        const isEffective = (startIndex: number, foundOpeningBracket: boolean) => {
            let _foundOpeningBracket = foundOpeningBracket;
            let tokenFound = false;

            for (let i = startIndex; i < value.length; i++) {
                if (value[i] === "[") {
                    if (!_foundOpeningBracket && !tokenFound) {
                        _foundOpeningBracket = true;
                        continue;
                    }
                    if (_foundOpeningBracket && tokenFound) {
                        return true;
                    }
                }

                if (value[i] === token) {
                    tokenFound = true;

                    if (
                        !value.slice(i + 1).includes("]") &&
                        !value.slice(i + 1).includes("[")
                    ) {
                        return true;
                    }


                    if (!_foundOpeningBracket) {
                        return true;
                    } else {
                        continue;
                    }
                }

                if (value[i] === "]" && _foundOpeningBracket && tokenFound) {
                    return isEffective(i + 1, true);
                }
            }
        };

        return isEffective(0, false);
    }

    const containsValidToken = (tokens: string[]) => {
        return tokens.some((token) => isTokenEffective(token));
    }

    // Check for missing essential information based on granularity
    const missingInfo = (() => {
        if (!containsValidToken(["Y", "y", "gg", "GG"])) return "year (Y, y, gg, or GG)";

        switch (granularity) {
            case "quarter":
                if (!containsValidToken(["Q"])) return "quarter (Q)";
                break;
            case "month":
                if (!containsValidToken(["M"])) return "month (M)";
                break;
            case "week":
                if (!containsValidToken(["w", "W"])) return "week (w or W)";
                break;
            case "day":
                if (!containsValidToken(["M"])) return "month (M)";
                if (!containsValidToken(["D"])) return "day (D)";
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
    value: string,
    granularity: IGranularity,
): void {
    let isValidFormatNew = true;
    for (const granularity of granularities) {
        const isNew = get(settingsStore).notes[granularity].formats.every((f) =>
            f.value !== value
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
                            value,
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
    value: string,
    granularity: IGranularity,
    id: string,
) {
    for (const g of granularities) {
        const formats = get(settingsStore).notes[g].formats;

        for (const f of formats) {
            if (f.id !== id && f.value === value) {
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
    value: string,
    granularity: IGranularity,
    id: string,
): string {
    let error = "";

    if (!value) {
        return error = "";
    }

    if (!validateFilename(value)) {
        return error = "Format contains illegal characters";
    }

    const currentDate = window.moment();
    const formattedDate = window.moment().format(value);
    let parsedDate = window.moment(formattedDate, value, true);
    if (granularity === 'week' && isWeekFormatAmbiguous(value)) {
        parsedDate = window.moment(
            formattedDate,
            value.replace(/M{1,4}/g, '').replace(/D{1,4}/g, ''),
            false
        );
    }

    // Check for ambiguous formats
    const ambiguityError = isAmbiguousFormat(
        value,
        currentDate,
        parsedDate,
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
        value,
        granularity,
        id,
    );
    if (duplicate) {
        return error = errorMsg;
    }

    return error;
}
