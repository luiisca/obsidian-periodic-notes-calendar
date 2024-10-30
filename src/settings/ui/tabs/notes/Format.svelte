<script lang="ts">
	import { DEFAULT_FORMATS_PER_GRANULARITY } from '@/constants';
	import {
		ensureFolderExists,
		getNotePath,
		storeAllVaultPeriodicFilepaths,
		type IGranularity
	} from '@/io';
	import { validateFormat } from '@/io/validation';
	import { settingsStore, type PeriodSettings } from '@/settings';
	import { internalRenamingStore } from '@/stores/notes';
	import { createConfirmationDialog } from '@/ui/modals/confirmation';
	import { INotesContext } from '@/ui/types';
	import { genNoticeFragment } from '@/ui/utils';
	import clsx from 'clsx';
	import { Notice, debounce, setIcon, type TFile } from 'obsidian';
	import { getContext, onMount } from 'svelte';
	import { type Writable } from 'svelte/store';
	import DeleteFormatText from './DeleteFormatText.svelte';
	import FilepathsCount from './FilepathsCount.svelte';
	import ReplaceAllText from './ReplaceAllText.svelte';
	import ReplaceAllTitle from './ReplaceAllTitle.svelte';

	export let index: number = 0;
	export let settings: Writable<PeriodSettings>;
	export let format: PeriodSettings['formats'][number] = {
		id: '',
		value: '',
		error: ''
	};
	export let granularity: IGranularity = 'day';
	export let type: 'default' | 'skeleton' = 'default';

	const defaultFormat = DEFAULT_FORMATS_PER_GRANULARITY[granularity];
	let removeBttnEl: HTMLElement;
	let replaceBttnEl: HTMLElement;
	let value = format.value || '';
	let error = format.error || '';
	$: selected = type === 'skeleton' ? false : format.id === $settings.selectedFormat.id;
	let { triggerRerender } = getContext<INotesContext>('notesContext');
	let loading = false;

	// Mock data
	$: filepaths = $settingsStore.filepathsByFormatValue[format.value] || {};
	$: filesCount = Object.keys(filepaths).length;

	function handleUpdate() {
		debounce(() => {
			error = validateFormat(value, granularity, format.id);
			triggerRerender?.update((n) => n + 1);

			settings.update((s) => {
				const updatedFormat = {
					...s.formats[index],
					value,
					error
				};
				s.formats[index] = updatedFormat;
				if (selected) {
					s.selectedFormat = updatedFormat;
				}

				return s;
			});
		}, 500)();

		debounce(() => {
			storeAllVaultPeriodicFilepaths(false, [granularity], [format]);
		}, 2000)();
	}

	function handleSelect() {
		settings.update((s) => {
			if (type === 'skeleton') {
				s.formats.push({
					id: window.crypto.randomUUID(),
					value: '',
					error: ''
				});
			} else {
				// revalidate format on select since on:input debounce validation may not be triggered yet
				error = validateFormat(value, granularity, format.id);

				const newSelectedFormat = {
					...$settings.formats[index],
					value,
					error
				};
				s.selectedFormat = newSelectedFormat;
				s.formats[index] = newSelectedFormat;
			}
			return s;
		});
	}

	function handleReplaceAll(e: Event) {
		e.preventDefault();

		const replaceAll = () => {
			internalRenamingStore.set(true);

			const oldFormats = $settings.formats;
			settings.update((s) => {
				// 1. select format
				s.selectedFormat = s.formats[index];
				return s;
			});

			// 2. rename all files
			let oldFormatsParsedCount = 0;
			oldFormats.forEach(async (oldFormat, oldFormatIndex) => {
				if (oldFormat.id === format.id) return;
				oldFormatsParsedCount += 1;

				const oldFilepaths = $settingsStore.filepathsByFormatValue[oldFormat.value] || {};
				const oldFilesCount = Object.keys(oldFilepaths).length;
				if (oldFilesCount) {
					loading = true;

					Object.keys(oldFilepaths).forEach(async (oldFilepath, oldFilepathIndex) => {
						const oldFile = window.app.vault.getAbstractFileByPath(oldFilepath) as TFile | null;
						const date = window.moment(oldFile?.basename, oldFormat.value, true);
						const newNormalizedPath = getNotePath(granularity, date, format, oldFile?.parent?.path);

						await ensureFolderExists(newNormalizedPath);
						if (oldFile) {
							try {
								await window.app.vault.rename(oldFile, newNormalizedPath);

								settingsStore.update((s) => {
									// delete old
									delete s.filepaths[oldFilepath];
									delete s.filepathsByFormatValue[oldFormat.value]?.[oldFilepath];

									// add new
									s.filepaths[newNormalizedPath] = format.value;
									if (!(format.value in s.filepathsByFormatValue)) {
										s.filepathsByFormatValue[format.value] = {};
									}

									s.filepathsByFormatValue[format.value]![newNormalizedPath] = newNormalizedPath;

									return s;
								});

								// one format is always omitted as is the target format and we avoid renaming its filepaths unnecessarily
								if (
									oldFormatsParsedCount === oldFormats.length - 1 &&
									oldFilepathIndex === oldFilesCount - 1
								) {
									loading = false;
									internalRenamingStore.set(false);
								}
							} catch (error) {
								new Notice(
									genNoticeFragment([
										[`Failed to rename ${oldFilepath} to ${newNormalizedPath}: `],
										[error.message, 'u-pop']
									]),
									8000
								);

								// sometimes the last oldFormat is omitted b/c is the target format
								if (
									oldFormatsParsedCount === oldFormats.length - 1 &&
									oldFilepathIndex === oldFilesCount - 1
								) {
									loading = false;
									internalRenamingStore.set(false);
								}
							}
						}
					});
				}
			});
		};

		const shouldConfirm = $settingsStore.shouldConfirmBeforeReplaceAllFormats;
		if (shouldConfirm) {
			createConfirmationDialog({
				title: {
					Component: ReplaceAllTitle,
					props: {
						replacingFormat: format.value
					}
				},
				text: {
					Component: ReplaceAllText,
					props: {
						replacingFormat: format.value,
						granularity
					}
				},
				cta: 'Replace',
				onAccept: (dontAskAgain) => {
					replaceAll();

					if (dontAskAgain) {
						settingsStore.update((settings) => ({
							...settings,
							shouldConfirmBeforeReplaceAllFormats: false
						}));
					}
				}
			});
		} else {
			replaceAll();
		}
	}

	function handleRemove(e: Event) {
		e.preventDefault();

		const remove = () => {
			settings.update((settings) => {
				let newSettings = {
					...settings,
					formats: [...settings.formats.slice(0, index), ...settings.formats.slice(index + 1)]
				};

				// helps ensure at least one format is selected at all times
				console.log('👉 on remove', newSettings, format);
				if (selected && newSettings.formats.length > 0) {
					newSettings = {
						...newSettings,
						selectedFormat: newSettings.formats[0]
					};
				}
				// helps ensure at least one format exists at all times
				const lastFormatEmpty =
					newSettings.formats.length === 1 && newSettings.formats[0].value.trim() === '';
				if (newSettings.formats.length === 0 || lastFormatEmpty) {
					const id = window.crypto.randomUUID();
					const newSelectedFormat = {
						id,
						value: defaultFormat,
						error: ''
					};
					newSettings = {
						...newSettings,
						selectedFormat: newSelectedFormat,
						formats: [newSelectedFormat]
					};
				}

				return newSettings;
			});

			trySelectLastOnlyFormat();

			triggerRerender?.update((n) => n + 1);
		};

		if (filesCount) {
			const shouldConfirm = $settingsStore.shouldConfirmBeforeDeleteFormat;
			// TODO: reword
			if (shouldConfirm) {
				createConfirmationDialog({
					title: `Delete format`,
					text: {
						Component: DeleteFormatText,
						props: { format, granularity }
					},
					cta: 'Delete',
					onAccept: (dontAskAgain) => {
						remove();

						if (dontAskAgain) {
							settingsStore.update((settings) => ({
								...settings,
								shouldConfirmBeforeDeleteFormat: false
							}));
						}
					}
				});
			} else {
				remove();
			}
		} else {
			remove();
		}
	}

	onMount(() => {
		if (type !== 'skeleton') {
			console.log(`🌿 Format ~ onMount - ${granularity}`, `error: ${error}`, format.value);
			error = validateFormat(value, granularity, format.id);
			console.log(`🌿 Format ~ onMount - ${granularity} - after validate`, `error: ${error}`);
			settings.update((settings) => {
				console.log(`🌿 Format ~ onMount updating settings`, settings, error, index);
				return {
					...settings,
					formats: [
						...settings.formats.slice(0, index),
						{
							...settings.formats[index],
							error
						},
						...settings.formats.slice(index + 1)
					]
				};
			});
			trySelectLastOnlyFormat();

			// set icons
			setIcon(replaceBttnEl, 'replace-all');
			setIcon(removeBttnEl, 'x');
		}
	});

	function trySelectLastOnlyFormat() {
		if ($settings.formats.length === 1) {
			settings.update((settings) => ({
				...settings,
				selectedFormat: settings.formats[0]
			}));
		}
	}

	$: {
		if ($triggerRerender) {
			console.log('🔁 rerendering', granularity, value, format.id);
			error = validateFormat(value, granularity, format.id);
		}
	}
	$: {
		console.log('❌ error changed', error);
		settings.update((settings) => ({
			...settings,
			formats: [
				...settings.formats.slice(0, index),
				{
					...settings.formats[index],
					error
				},
				...settings.formats.slice(index + 1)
			]
		}));
	}
</script>

<!-- Format Option -->
<label
	class={clsx(
		'w-full cursor-pointer flex space-x-2 rounded-lg border p-3 mb-4 last:mb-0',
		type === 'skeleton' &&
			'relative border-dashed hover:border-solid bg-transparent hover:bg-gray-500',
		error
			? 'border-red-500 bg-red-50 dark:bg-red-900/20'
			: selected
			? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
			: 'border-gray-200 dark:border-gray-700'
	)}
>
	{#if type === 'skeleton'}
		<button class="opacity-0" on:click={handleSelect} />
	{:else}
		<input type="radio" name="format" checked={selected} on:click={handleSelect} />
	{/if}

	<div class={clsx('w-full transition-all duration-200', type === 'skeleton' && 'opacity-0 -z-50')}>
		<div class="flex items-center gap-2">
			<input
				type="text"
				bind:value
				spellcheck={false}
				placeholder={defaultFormat}
				aria-invalid={!!error}
				aria-describedby={error ? 'format-error' : undefined}
				class={clsx(
					'flex-1 bg-transparent text-sm focus:outline-none',
					error ? 'placeholder-red-300' : 'placeholder-gray-400'
				)}
				on:input={handleUpdate}
			/>
			<div class="flex space-x-1">
				<!-- replace -->
				<button
					class={clsx(
						'clickable-icon extra-setting-button',
						error || value.trim() === ''
							? 'cursor-not-allowed hover:bg-transparent hover:opacity-70'
							: 'cursor-pointer'
					)}
					aria-label="Replace all formats with this one"
					bind:this={replaceBttnEl}
					on:click={handleReplaceAll}
					disabled={!!error || value.trim() === ''}
				/>
				<!-- remove -->
				<button
					class="clickable-icon extra-setting-button cursor-pointer"
					aria-label="Remove format"
					bind:this={removeBttnEl}
					on:click={handleRemove}
				/>
			</div>
		</div>

		<p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
			<FilepathsCount {format} />
			{#if error}
				<span class="mt-2 text-xs text-red-500" id="format-error">
					{error}
				</span>
			{:else}
				<span class="u-pop">{value.trim() ? window.moment().format(value) : 'Empty format'}</span>
			{/if}
		</p>
		{#if loading}
			<p>Renaming...</p>
		{/if}
	</div>
	{#if type === 'skeleton'}
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			class="svg-icon lucide-plus absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
			><path d="M5 12h14" /><path d="M12 5v14" /></svg
		>
	{/if}
</label>

<style lang="postcss">
	@tailwind utilities;
</style>
