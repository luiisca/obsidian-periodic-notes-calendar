import type { Moment } from 'moment';
import type { TFile } from 'obsidian';

import { basename } from './vault';
import type { IGranularity, IPeriodicites } from './types';
import { getNoteSettingsByGranularity } from './settings';

/**
 * dateUID is a way of weekly identifying daily/weekly/monthly notes.
 * They are prefixed with the granularity to avoid ambiguity.
 */
export function getDateUID(date: Moment, granularity: IGranularity = 'day'): string {
	return `${granularity}-${date.startOf(granularity).format()}`;
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

export function getDateFromFile(file: TFile, granularity: IGranularity): Moment | null {
	return getDateFromFilename(file.basename, granularity);
}

export function getDateFromPath(
	path: string,
	granularity: 'day' | 'week' | 'month' | 'quarter' | 'year'
): Moment | null {
	return getDateFromFilename(basename(path), granularity);
}

function getDateFromFilename(
	filename: string,
	granularity: 'day' | 'week' | 'month' | 'quarter' | 'year'
): Moment | null {
	const format = getNoteSettingsByGranularity(granularity).format.split('/').pop();

	// TODO: Find a way to validate if a filename represents a valid date without using format to avoid:
	// every time periodic notes update and format changes only notes created with the new format are stored, the rest are neglected.
	// evaluate if current format creates a valid date
	const noteDate = window.moment(filename, format, true);

	if (!noteDate.isValid()) {
		return null;
	}

	if (granularity === 'week') {
		if (format && isWeekFormatAmbiguous(format)) {
			const cleanFormat = removeEscapedCharacters(format);
			if (/w{1,2}/i.test(cleanFormat)) {
				return window.moment(
					filename,
					// If format contains week, remove day & month formatting
					format.replace(/M{1,4}/g, '').replace(/D{1,4}/g, ''),
					false
				);
			}
		}
	}

	return noteDate;
}

export function getPeriodicityFromGranularity(granularity: IGranularity): IPeriodicites {
	return granularity === 'day' ? 'daily' : `${granularity}ly`;
}
