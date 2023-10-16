import { NOTE_FORMATS } from './constants';
import { getPeriodicityFromGranularity } from './parse';
import type { IGranularity, IPeriodicNoteSettings, IPeriodicites } from './types';

export class NoDailyNotesMngPluginFoundError extends Error {}

export function shouldUsePeriodicNotesSettings(
	periodicity: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
): boolean {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const periodicNotes = (<any>window.app).plugins.getPlugin('periodic-notes');
	return periodicNotes && periodicNotes.settings?.[periodicity]?.enabled;
}

/**
 * Read the user settings for the `${granularity}-notes` plugin
 * to keep behavior of creating a new note in-sync.
 */
export function getNoteSettingsByGranularity(granularity: IGranularity): IPeriodicNoteSettings {
	const periodicity = getPeriodicityFromGranularity(granularity);
	const defaultNoteFormat = NOTE_FORMATS[periodicity.toUpperCase() as Uppercase<IPeriodicites>];

	try {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const { internalPlugins, plugins } = <any>window.app;

		if (shouldUsePeriodicNotesSettings(periodicity)) {
			const { format, folder, template } =
				plugins.getPlugin('periodic-notes')?.settings?.[periodicity] || {};

			return {
				format: format || defaultNoteFormat,
				folder: folder?.trim() || '/',
				template: template?.trim() || ''
			};
		}

		if (periodicity === 'daily') {
			const { folder, format, template } =
				internalPlugins.getPluginById('daily-notes')?.instance?.options || {};
			return {
				format: format || defaultNoteFormat,
				folder: folder?.trim() || '/',
				template: template?.trim() || ''
			};
		}

		return {
			format: defaultNoteFormat,
			folder: '/',
			template: ''
		};
	} catch (err) {
		console.info('No custom daily note settings found! Ensure the plugin is active.', err);

		return {
			format: defaultNoteFormat,
			folder: '/',
			template: ''
		};
	}
}
