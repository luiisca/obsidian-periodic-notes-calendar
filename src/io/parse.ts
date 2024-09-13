import type { Moment } from 'moment';
import type { TFile } from 'obsidian';

import { basename } from './vault';
import type { IGranularity, IPeriodicity } from './types';
import { getNoteSettingsByPeriodicity } from './settings';
import { get } from 'svelte/store';
import { settingsStore } from '@/settings';
import { logger } from '@/utils';

/**
 * dateUID is a way of identifying periodic notes.
 * They are prefixed with the given granularity to avoid ambiguity.
 * e.g.: "day-2022/01/01", "week-20"
 */
export function getDateUID({
    date,
    granularity,
    localeAware
}: {
    date: Moment;
    granularity: IGranularity;
    localeAware?: boolean;
}): string {
    return `${granularity}-${date
        .startOf(granularity || 'day')
        .clone()
        .locale(localeAware ? window.moment.locale() : 'en')
        .format()}`;
}

function removeEscapedCharacters(format: string): string {
    return format.replace(/\[[^\]]*\]/g, ''); // remove everything within brackets
}

/**
 * XXX: When parsing dates that contain both week numbers and months,
 * Moment choses to ignore the week numbers. For the week dateUID, we
 * want the opposite behavior. Strip the MMM from the format to patch.
 */
function isWeekFormatAmbiguous(format: string) {
    const cleanFormat = removeEscapedCharacters(format);
    return /w{1,2}/i.test(cleanFormat) && (/M{1,4}/.test(cleanFormat) || /D{1,4}/.test(cleanFormat));
}

export function getDateFromFile(
    file: TFile,
    granularity: IGranularity,
    useCrrFormat = false
): Moment | null {
    return getDateFromFilename(file.basename, granularity, useCrrFormat);
}

export function getDateFromPath(
    path: string,
    granularity: 'day' | 'week' | 'month' | 'quarter' | 'year',
    useCrrFormat = false
): Moment | null {
    return getDateFromFilename(basename(path), granularity, useCrrFormat);
}

function getDateFromFilename(
    filename: string,
    granularity: 'day' | 'week' | 'month' | 'quarter' | 'year',
    useCrrFormat = false
): Moment | null {
    let noteDate = null;
    let validFormat;
    if (useCrrFormat) {
        const { format } = getNoteSettingsByPeriodicity(getPeriodicityFromGranularity(granularity));
        logger("[io-parse]", granularity, format);
        const date = window.moment(filename, format, true);

        if (date.isValid()) {
            noteDate = date;
            validFormat = format;
        }
    } else {
        for (const format of get(settingsStore).validFormats[granularity]) {
            const date = window.moment(filename, format, true);

            // if date is valid and date represents the exact date described by filename 
            if (date.isValid() && date.format(format) === filename) {
                noteDate = date;
                validFormat = format;

                break;
            }
        }
    }

    if (!noteDate) {
        return null;
    }

    if (granularity === 'week') {
        if (validFormat && isWeekFormatAmbiguous(validFormat)) {
            const cleanFormat = removeEscapedCharacters(validFormat);
            if (/w{1,2}/i.test(cleanFormat)) {
                return window.moment(
                    filename,
                    // If format contains week, remove day & month formatting
                    validFormat.replace(/M{1,4}/g, '').replace(/D{1,4}/g, ''),
                    false
                );
            }
        }
    }

    return noteDate;
}

export function getPeriodicityFromGranularity(granularity: IGranularity): IPeriodicity {
    return granularity === 'day' ? 'daily' : `${granularity}ly`;
}
