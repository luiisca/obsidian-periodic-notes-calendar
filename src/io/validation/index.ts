import { granularities } from '@/constants';
import { settingsStore } from '@/settings';
import { type Moment } from 'moment';
import { get } from 'svelte/store';
import { type IGranularity } from '../types';
import { normalizePath } from 'obsidian';

export function removeEscapedCharacters(format: string): string {
    const withoutBrackets = format.replace(/\[[^\]]*\]/g, ''); // remove everything within brackets

    return withoutBrackets.replace(/\\./g, '');
}

export function getBasename(format: string): string {
    const isTemplateNested = format.indexOf('/') !== -1;
    return isTemplateNested ? format.split('/').pop() ?? '' : format;
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

export function validateFolder(folder: string): string {
    if (!folder || folder === "/") {
        return "";
    }

    if (!window.app.vault.getAbstractFileByPath(normalizePath(folder))) {
        return "Folder not found in vault";
    }

    return "";
}
export function validateTemplate(template: string): string {
    if (!template) {
        return "";
    }

    if (!window.app.metadataCache.getFirstLinkpathDest(template, "")) {
        return "Template file not found";
    }

    return "";
}

export * from "./format"
