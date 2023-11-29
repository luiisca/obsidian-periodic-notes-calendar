import { granularities } from '@/constants';
import type { IGranularity } from './types';
import { getNoteSettingsByGranularity } from './settings';

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

export function getNewValidFormats(
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

	granularities.forEach((granularity) => {
		const format = getNoteSettingsByGranularity(granularity).format.split('/').pop();

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
