import type { Moment } from 'moment';
import { Notice, TFile } from 'obsidian';

import { getNotePath, getTemplateInfo } from './vault';
import { getNoteSettingsByGranularity } from './settings';

export class QuarterlyNotesFolderMissingError extends Error {}

/**
 * This function mimics the behavior of the daily-notes plugin
 * so it will replace {{date}}, {{title}}, and {{time}} with the
 * formatted timestamp.
 *
 * Note: it has an added bonus that it's not 'today' specific.
 */
export async function createQuarterlyNote(date: Moment): Promise<TFile | undefined> {
	const { vault } = window.app;
	const { template, format, folder } = getNoteSettingsByGranularity('quarter');
	const [templateContents, IFoldInfo] = await getTemplateInfo(template);
	const filename = date.format(format);
	const normalizedPath = await getNotePath(folder, filename);

	try {
		const createdFile = await vault.create(
			normalizedPath,
			templateContents
				.replace(
					/{{\s*(date|time)\s*(([+-]\d+)([yqmwdhs]))?\s*(:.+?)?}}/gi,
					(_, _timeOrDate, calc, timeDelta, unit, momentFormat) => {
						const now = window.moment();
						const currentDate = date.clone().set({
							hour: now.get('hour'),
							minute: now.get('minute'),
							second: now.get('second')
						});
						if (calc) {
							currentDate.add(parseInt(timeDelta, 10), unit);
						}

						if (momentFormat) {
							return currentDate.format(momentFormat.substring(1).trim());
						}
						return currentDate.format(format);
					}
				)
				.replace(/{{\s*date\s*}}/gi, filename)
				.replace(/{{\s*time\s*}}/gi, window.moment().format('HH:mm'))
				.replace(/{{\s*title\s*}}/gi, filename)
		);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(window.app as any).foldManager.save(createdFile, IFoldInfo);

		return createdFile;
	} catch (err) {
		console.error(`Failed to create file: '${normalizedPath}'`, err);
		new Notice(`Failed to create file: '${normalizedPath}'`);
	}
}
