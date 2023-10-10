import {
	DEFAULT_DAILY_NOTE_FORMAT,
	DEFAULT_MONTHLY_NOTE_FORMAT,
	DEFAULT_WEEKLY_NOTE_FORMAT,
	DEFAULT_QUARTERLY_NOTE_FORMAT,
	DEFAULT_YEARLY_NOTE_FORMAT
} from './constants';
import type { IPeriodicNoteSettings } from './types';

export class NoDailyNotesMngPluginFoundError extends Error {}

export function shouldUsePeriodicNotesSettings(
	periodicity: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
): boolean {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const periodicNotes = (<any>window.app).plugins.getPlugin('periodic-notes');
	return periodicNotes && periodicNotes.settings?.[periodicity]?.enabled;
}

/**
 * Read the user settings for the `daily-notes` plugin
 * to keep behavior of creating a new note in-sync.
 */
export function getDailyNoteSettings(): IPeriodicNoteSettings {
	try {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const { internalPlugins, plugins } = <any>window.app;

		if (shouldUsePeriodicNotesSettings('daily')) {
			const { format, folder, template } =
				plugins.getPlugin('periodic-notes')?.settings?.daily || {};

			return {
				format: format || DEFAULT_DAILY_NOTE_FORMAT,
				folder: folder?.trim() || '/',
				template: template?.trim() || ''
			};
		}

		const { folder, format, template } =
			internalPlugins.getPluginById('daily-notes')?.instance?.options || {};
		return {
			format: format || DEFAULT_DAILY_NOTE_FORMAT,
			folder: folder?.trim() || '/',
			template: template?.trim() || ''
		};
	} catch (err) {
		console.info('No custom daily note settings found! Ensure the plugin is active.', err);

		return {
			format: DEFAULT_DAILY_NOTE_FORMAT,
			folder: '/',
			template: ''
		};
	}
}

/**
 * Read the user settings for the `weekly-notes` plugin
 * to keep behavior of creating a new note in-sync.
 */
export function getWeeklyNoteSettings(): IPeriodicNoteSettings {
	try {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const pluginManager = (<any>window.app).plugins;

		if (shouldUsePeriodicNotesSettings('weekly')) {
			const { format, folder, template } =
				pluginManager.getPlugin('periodic-notes').settings.weekly;

			return {
				format: format || DEFAULT_WEEKLY_NOTE_FORMAT,
				folder: folder?.trim() || '',
				template: template?.trim() || ''
			};
		}

		return {
			format: DEFAULT_WEEKLY_NOTE_FORMAT,
			folder: '/',
			template: ''
		};
	} catch (err) {
		console.info('No custom weekly note settings found! Ensure the plugin is active.', err);

		// allow users to create notes no matter if periodic notes plugin is not installed or disabled
		return {
			format: DEFAULT_WEEKLY_NOTE_FORMAT,
			folder: '/',
			template: ''
		};
	}
}

/**
 * Read the user settings for the `periodic-notes` plugin
 * to keep behavior of creating a new note in-sync.
 */
export function getMonthlyNoteSettings(): IPeriodicNoteSettings {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const pluginManager = (<any>window.app).plugins;

	try {
		const settings =
			(shouldUsePeriodicNotesSettings('monthly') &&
				pluginManager.getPlugin('periodic-notes')?.settings?.monthly) ||
			{};

		return {
			format: settings.format || DEFAULT_MONTHLY_NOTE_FORMAT,
			folder: settings.folder?.trim() || '',
			template: settings.template?.trim() || ''
		};
	} catch (err) {
		console.info('No custom monthly note settings found! Ensure the plugin is active.', err);

		throw new NoDailyNotesMngPluginFoundError(
			'No custom monthly note settings found! Ensure the plugin is active.'
		);
	}
}

/**
 * Read the user settings for the `periodic-notes` plugin
 * to keep behavior of creating a new note in-sync.
 */
export function getQuarterlyNoteSettings(): IPeriodicNoteSettings {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const pluginManager = (<any>window.app).plugins;

	try {
		const settings =
			(shouldUsePeriodicNotesSettings('quarterly') &&
				pluginManager.getPlugin('periodic-notes')?.settings?.quarterly) ||
			{};

		return {
			format: settings.format || DEFAULT_QUARTERLY_NOTE_FORMAT,
			folder: settings.folder?.trim() || '',
			template: settings.template?.trim() || ''
		};
	} catch (err) {
		console.info('No custom quarterly note settings found! Ensure the plugin is active.', err);

		throw new NoDailyNotesMngPluginFoundError(
			'No custom quarterly note settings found! Ensure the plugin is active.'
		);
	}
}

/**
 * Read the user settings for the `periodic-notes` plugin
 * to keep behavior of creating a new note in-sync.
 */
export function getYearlyNoteSettings(): IPeriodicNoteSettings {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const pluginManager = (<any>window.app).plugins;

	try {
		const settings =
			(shouldUsePeriodicNotesSettings('yearly') &&
				pluginManager.getPlugin('periodic-notes')?.settings?.yearly) ||
			{};

		return {
			format: settings.format || DEFAULT_YEARLY_NOTE_FORMAT,
			folder: settings.folder?.trim() || '',
			template: settings.template?.trim() || ''
		};
	} catch (err) {
		console.info('No custom yearly note settings found! Ensure the plugin is active.', err);

		throw new NoDailyNotesMngPluginFoundError(
			'No custom yearly note settings found! Ensure the plugin is active.'
		);
	}
}
