import { granularities } from '@/constants';
import { settingsStore } from '@/settings';
import { logger } from '@/utils';
import { Notice } from 'obsidian';
import { get } from 'svelte/store';
import { getNoteSettings } from './settings';
import type { IGranularity } from './types';
import { Moment } from 'moment';

// https://github.com/liamcain/obsidian-periodic-notes
function validateFilename(filename: string): boolean {
    const illegalRe = /[?<>\\:*|"]/g;
    // eslint-disable-next-line no-control-regex
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

export function removeEscapedCharacters(format: string): string {
    const withoutBrackets = format.replace(/\[[^\]]*\]/g, ''); // remove everything within brackets

    return withoutBrackets.replace(/\\./g, '');
}
export function getBasename(format: string): string {
    const isTemplateNested = format.indexOf('/') !== -1;
    return isTemplateNested ? format.split('/').pop() ?? '' : format;
}

export function validateFormat(format: string, granularity: IGranularity): boolean {
    const formattedDate = window.moment().format(format);
    const parsedDate = window.moment(formattedDate, format, true);
    if (!parsedDate.isValid()) {
        return false;
    }

    // return false if at least one required character is not included in the daily format
    // TODO: add back when migrating to custom periodic notes settings
    // if (
    //     granularity === 'day' &&
    //     !['m', 'd', 'y'].every(
    //         (requiredChar) =>
    //             getBasename(format)
    //                 .replace(/\[[^\]]*\]/g, '') // remove everything within brackets
    //                 .toLowerCase()
    //                 .indexOf(requiredChar) !== -1
    //     )
    // ) {
    //     return false;
    // }

    return true;
}

/**
    * Get new valid formats from periodic notes plugin and/or daily notes plugin settings
    * or default formats in case none of them are enabled or installed.
    *   
    * @note should noly be called after plugin loads, to ensure plugins settings access.
    */
export function getNewValidFormatsFromSettings(
    existingValidFormats: Record<IGranularity, string[]> = {
        day: [],
        week: [],
        month: [],
        quarter: [],
        year: []
    }
) {
    const validFormats: Record<IGranularity, string[]> = {
        ...existingValidFormats
    };

    let warningDisplayed = false;

    granularities.forEach((granularity) => {
        const format = getNoteSettings()[granularity].format.split('/').pop();
        logger("[io-validation-format]", granularity, format);

        if (granularity !== 'day' && /^\d{1,2}$/.test(window.moment().format(format))) {
            if (!warningDisplayed) {
                // TODO: rewrite
                new Notice(
                    'Caution ⚠️: Avoid using formats which only yield two-digit numbers, such as "W" or "M", as they can make identifying notes periodicities harder and error prone', 5500);
                warningDisplayed = true;
            }
        }

        if (!format) {
            return;
        }

        const isFilenameValid = validateFilename(format);
        const isFormatValid = validateFormat(format, granularity);
        const isNewFormat = validFormats[granularity].indexOf(format) === -1;

        if (isFilenameValid && isFormatValid && isNewFormat) {
            validFormats[granularity].push(format);
        }
    });

    return validFormats;
}


/**
 * XXX: When parsing dates that contain both week numbers and months,
 * Moment choses to ignore the week numbers. For the week noteDateUID, we
 * want the opposite behavior. Strip the MMM from the format to patch.
 */
function isWeekFormatAmbiguous(format: string) {
    const cleanFormat = removeEscapedCharacters(format);
    return /w{1,2}/i.test(cleanFormat) && (/M{1,4}/.test(cleanFormat) || /D{1,4}/.test(cleanFormat));
}

export function isValidPeriodicNote(fileName: string, customGranularities = granularities as unknown as IGranularity[])
    : { isValid: true, granularity: IGranularity, date: Moment } | { isValid: false, granularity: null, date: null } {

    const validFormats = get(settingsStore).validFormats;

    for (const granularity of customGranularities) {
        for (const validFormat of validFormats[granularity]) {
            let date = window.moment(fileName, validFormat, true);

            if (date.isValid() && date.format(validFormat) === fileName) {
                if (granularity === 'week') {
                    console.log("week, validFormat: ", validFormat);
                    if (validFormat && isWeekFormatAmbiguous(validFormat)) {
                        const cleanFormat = removeEscapedCharacters(validFormat);
                        if (/w{1,2}/i.test(cleanFormat)) {
                            date = window.moment(
                                fileName,
                                // If format contains week, remove day & month formatting, dont remember why 😅
                                validFormat.replace(/M{1,4}/g, '').replace(/D{1,4}/g, ''),
                                false
                            );
                        }
                    }
                }

                return { isValid: true, granularity, date }
            }
        }
    }

    return { isValid: false, granularity: null, date: null };
}
