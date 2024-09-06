import { App, Notice, TFile } from 'obsidian';

import { getTemplateInfo, getNotePath } from './vault';
import type { Moment } from 'moment';
import { getNoteSettingsByGranularity } from './settings';

/**
 * This function mimics the behavior of the daily-notes plugin
 * so it will replace {{date}}, {{title}}, and {{time}} with the
 * formatted timestamp.
 *
 * Note: it has an added bonus that it's not 'today' specific.
 */
export async function createDailyNote(date: Moment): Promise<TFile | undefined> {
	const app = window.app as App;
	const { vault } = app;

	const { template, folder, format } = getNoteSettingsByGranularity('day');

	// TODO: Find out what IFoldInfo is used for (think it is for keeping track of openned folders)
	const [templateContents, IFoldInfo] = await getTemplateInfo(template);
	const filename = date.format(format);
	const normalizedPath = await getNotePath(folder, filename);

	// console.table(getNoteSettingsByGranularity('day'));
	// console.log('getTemplateInfo:', templateContents, IFoldInfo);
	// console.log("onClickDay() > createDailyNote > filename, format: ", filename, format)
	// console.log('NOrmalized path', normalizedPath);

	try {
		const createdFile = await vault.create(
			normalizedPath,
			templateContents
				.replace(/{{\s*date\s*}}/gi, filename)
				.replace(/{{\s*time\s*}}/gi, date.format('HH:mm'))
				.replace(/{{\s*title\s*}}/gi, filename)
				.replace(
					/{{\s*(date|time)\s*(([+-]\d+)([yqmwdhs]))?\s*(:.+?)?}}/gi,
					(_, _timeOrDate, calc, timeDelta, unit, momentFormat) => {
						let currentDate = window.moment();

						if (calc) {
							currentDate = currentDate.add(parseInt(timeDelta, 10), unit);
						}

						if (momentFormat) {
							return currentDate.format(momentFormat.substring(1).trim());
						}
						return currentDate.format(format);
					}
				)
				.replace(/{{\s*yesterday\s*}}/gi, date.subtract(1, 'd').format(format))
				.replace(/{{\s*tomorrow\s*}}/gi, date.add(1, 'd').format(format))
		);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(app as any).foldManager.save(createdFile, IFoldInfo);

		return createdFile;
	} catch (err) {
		console.error(`Failed to create file: '${normalizedPath}'`, err);
		new Notice(`Failed to create file: '${normalizedPath}'`);
	}
}
