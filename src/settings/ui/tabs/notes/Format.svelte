<script lang="ts">
	import { DEFAULT_FORMATS_PER_GRANULARITY } from '@/constants';
	import { getContext, onMount } from 'svelte';
	import clsx from 'clsx';
	import { type Writable } from 'svelte/store';
	import {
		ensureFolderExists,
		getNotePath,
		getPeriodicityFromGranularity,
		storeAllVaultPeriodicFilepaths,
		type IGranularity
	} from '@/io';
	import { settingsStore, type PeriodSettings } from '@/settings';
	import { validateFormat } from '@/io/validation';
	import { Notice, debounce, setIcon, type TFile } from 'obsidian';
	import { createConfirmationDialog } from '@/ui/modals/confirmation';
	import { INotesContext } from '@/ui/types';
	import FilepathsCount from './FilepathsCount.svelte';
	import DeleteFormatText from './DeleteFormatText.svelte';
	import { justModFileDataStore } from '@/stores/notes';
	import ReplaceAllText from './ReplaceAllText.svelte';
	import ReplaceAllTitle from './ReplaceAllTitle.svelte';
	import { genNoticeFragment } from '@/ui/utils';

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
			console.log('🌿 ~ handleUpdate ~ value', value);
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
			console.log('🌿 ~ handleUpdate ~ value', value);
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
			const oldFormats = $settings.formats;
			settings.update((s) => {
				// 1. select format
				s.selectedFormat = s.formats[index];
				return s;
			});

			// 2. rename all files
			oldFormats.forEach(async (oldFormat, oldFormatIndex) => {
				if (oldFormat.id === format.id) return;

				const oldFilepaths = $settingsStore.filepathsByFormatValue[oldFormat.value] || {};
				const oldFilesCount = Object.keys(oldFilepaths).length;
				if (oldFilesCount) {
					loading = true;

					Object.keys(oldFilepaths).forEach(async (oldFilepath, oldFilepathIndex) => {
						const file = window.app.vault.getAbstractFileByPath(oldFilepath) as TFile | null;
						const date = window.moment(file?.basename, oldFormat.value, true);
						const newNormalizedPath = getNotePath(granularity, date, format, file?.parent?.path);

						await ensureFolderExists(newNormalizedPath);
						if (file) {
							try {
								console.log('🎉🎉 ABOUT TO RENAME! ✅✅');
								console.log(
									'old filepath',
									oldFilepath,
									'old file',
									file,
									'old format',
									oldFormat,
									'old date',
									date,
									'new path',
									newNormalizedPath
								);

								await window.app.vault.rename(file, newNormalizedPath);

								justModFileDataStore.set({
									op: 'renamed',
									old: {
										granularity,
										format: oldFormat
									},
									new: {
										isValid: true,
										granularity,
										format
									}
								});
								console.log(
									'✅✅ RENAMED! 🎉🎉',
									'newNormalizedPath',
									newNormalizedPath,
									'justModFileDataStore',
									$justModFileDataStore
								);

								if (
									oldFormatIndex === oldFormats.length - 1 &&
									oldFilepathIndex === filesCount - 1
								) {
									loading = false;
								}
							} catch (error) {
								new Notice(
									genNoticeFragment([
										[`Failed to rename ${file.path} to ${newNormalizedPath}: `],
										[error.message, 'u-pop']
									]),
									8000
								);
								loading = false;
							}
						}
					});
				}
			});
		};

		if (filesCount) {
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
						props: { format }
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
					class="clickable-icon extra-setting-button cursor-pointer"
					aria-label="Replace all formats with this one"
					bind:this={replaceBttnEl}
					on:click={handleReplaceAll}
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
				<p class="mt-2 text-xs text-red-500" id="format-error">
					{error}
				</p>
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
