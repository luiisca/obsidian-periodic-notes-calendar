import { settingsStore } from "@/settings";
import { capitalize } from "@/utils";
import { get } from "svelte/store";
import { isWeekFormatAmbiguous } from ".";
import { getPeriodicityFromGranularity } from "../parse";
import { type IGranularity } from "../types";

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

export const isTokenEffective = (value: string, token: string) => {
    const isEffective = (startIndex: number, foundOpeningBracket: boolean) => {
        let _foundOpeningBracket = foundOpeningBracket;
        let tokenFound = false;
        let tokenFoundIndex = -1;

        for (let i = startIndex; i < value.length; i++) {
            if (value[i] === "[") {
                if (!_foundOpeningBracket && !tokenFound) {
                    _foundOpeningBracket = true;
                    continue;
                }
                if (_foundOpeningBracket && tokenFound) {
                    return {
                        isEffective: true,
                        effectiveTokenIndex: tokenFoundIndex,
                    };
                }
            }

            if (value[i] === token) {
                tokenFound = true;
                tokenFoundIndex = i

                if (
                    !value.slice(i + 1).includes("]") &&
                    !value.slice(i + 1).includes("[")
                ) {
                    return {
                        isEffective: true,
                        effectiveTokenIndex: tokenFoundIndex
                    };
                }


                if (!_foundOpeningBracket) {
                    return {
                        isEffective: true,
                        effectiveTokenIndex: tokenFoundIndex
                    };
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

function isAmbiguousFormat(
    value: string,
    currentDate: moment.Moment,
    parsedDate: moment.Moment,
    granularity: IGranularity,
): string | null {
    const errorMessage = "Ambiguous format.";

    const containsValidToken = (tokens: string[]) => {
        return tokens.some((token) => isTokenEffective(value, token)?.isEffective);
    }

    // Check for missing essential information based on granularity
    const missingInfo = (() => {
        if (containsValidToken(["x", "X"])) return null;
        if (containsValidToken(["l", "L"]) && value !== "LT" && value !== "LTS") return null;
        // dropped support for GG, it is ambiguous for some dates (e.g. 2020, 2030), dont know why
        if (!containsValidToken(["Y", "y", "g"])) return "year (Y, y, or gg)";

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

function checkIfDuplicateFormat(
    value: string,
    granularity: IGranularity,
    id: string,
) {
    const periods = get(settingsStore).periods
    for (const [g, periodSettings] of Object.entries(periods)) {
        for (const format of Object.values(periodSettings.formats)) {
            if (format.id !== id && format.value === value) {
                return {
                    duplicate: true,
                    errorMsg: `Duplicate format ${granularity === g
                        ? ""
                        : `from ${capitalize(getPeriodicityFromGranularity(g as IGranularity))
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
        error = "";
        return error;
    }

    if (!validateFilename(value)) {
        error = "Format contains illegal characters";
        return error;
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
        error = "Format is not valid";
        return error;
    }

    // check for duplicated valid formats
    const { duplicate, errorMsg } = checkIfDuplicateFormat(
        value,
        granularity,
        id,
    );
    if (duplicate) {
        error = errorMsg;
        return error;
    }

    return error;
}
