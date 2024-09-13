import { granularities } from '@/constants';
import type { IGranularity } from './types';
import { getNoteSettingsByPeriodicity } from './settings';
import { Notice } from 'obsidian';
import { getPeriodicityFromGranularity } from './parse';
import { logger } from '@/utils';

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
    const testFormattedDate = window.moment().format(format);
    const parsedDate = window.moment(testFormattedDate, format, true);
    if (!parsedDate.isValid()) {
        return false;
    }

    if (
        granularity === 'day' &&
        !['m', 'd', 'y'].every(
            (requiredChar) =>
                getBasename(format)
                    .replace(/\[[^\]]*\]/g, '') // remove everything within brackets
                    .toLowerCase()
                    .indexOf(requiredChar) !== -1
        )
    ) {
        return false;
    }

    return true;
}

/**
    * Get new valid formats from periodic notes plugin, daily notes plugin settings
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
        const format = getNoteSettingsByPeriodicity(getPeriodicityFromGranularity(granularity)).format.split('/').pop();
        logger("[io-validation-format]", granularity, format);

        if (granularity !== 'day' && /^\d{1,2}$/.test(window.moment().format(format))) {
            if (!warningDisplayed) {
                // TODO: rewrite
                new Notice(
                    'Caution ⚠️: Avoid using formats that yield two-digit numbers, such as "W" or "M", as they can be ambiguous and cause unexpected behavior.', 5500);
                warningDisplayed = true;
            }
        }

        if (!format) {
            return;
        }

        const isFilenameValid = validateFilename(format);
        const isFormatValid = validateFormat(format, granularity);
        const isNewFormat = validFormats[granularity].indexOf(format) === -1;

        isFilenameValid && isFormatValid && isNewFormat && validFormats[granularity].push(format);
    });

    return validFormats;
}
