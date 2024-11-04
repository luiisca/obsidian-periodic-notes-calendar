import { granularities } from '@/constants';
import { PeriodSettings, settingsStore, TFormat } from '@/settings';
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
 * When parsing dates that contain both week numbers and months,
 * Moment ignores the week numbers. Remove both M{1,4} and D{1,4} from format to patch.
 */
export function isWeekFormatAmbiguous(format: string) {
    const cleanFormat = removeEscapedCharacters(format);
    return /w{1,2}/i.test(cleanFormat) && (/M{1,4}/.test(cleanFormat) || /D{1,4}/.test(cleanFormat));
}

export function isValidPeriodicNote(fileName: string, customGranularities = granularities as unknown as IGranularity[], customFormats?: Record<string, TFormat>)
    : { isValid: boolean, granularity: IGranularity, date: Moment, format: PeriodSettings['formats'][0] } | { isValid: null, granularity: null, date: null, format: null } {

    for (const granularity of customGranularities) {
        const formats = customFormats || get(settingsStore).periods[granularity].formats;
        for (const format of Object.values(formats)) {
            let parsedDate = window.moment(fileName, format.value, true);
            const match = parsedDate.isValid() && parsedDate.format(format.value) === fileName

            if (match) {
                if (format.error) {
                    return { isValid: false, granularity, date: parsedDate, format };
                }

                if (granularity === 'week') {
                    console.log("week, format: ", format.value);
                    if (isWeekFormatAmbiguous(format.value)) {
                        parsedDate = window.moment(
                            fileName,
                            format.value.replace(/M{1,4}/g, '').replace(/D{1,4}/g, ''),
                            false
                        );
                    }
                }

                return { isValid: true, granularity, date: parsedDate, format };
            }
        }
    }

    return { isValid: null, granularity: null, date: null, format: null };
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
