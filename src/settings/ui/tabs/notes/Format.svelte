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
	import { internalFileModStore } from '@/stores/notes';
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

	export let settings: Writable<PeriodSettings>;
	export let format: PeriodSettings['formats'][number] = {
		id: '',
		value: '',
		error: '',
		loading: false
	};
	export let granularity: IGranularity = 'day';
	export let type: 'default' | 'skeleton' = 'default';

	const defaultFormat = DEFAULT_FORMATS_PER_GRANULARITY[granularity];
	let removeBttnEl: HTMLElement;
	let replaceBttnEl: HTMLElement;
	let labelEl: HTMLLabelElement;

	let value = format.value || '';
	let error = format.error || '';
	$: selected = type === 'skeleton' ? false : format.id === $settings.selectedFormat.id;
	let { triggerRerender } = getContext<INotesContext>('notesContext');
	let formatId = format.id;

	// Mock data
	$: filepaths = $settingsStore.filepathsByFormatValue[format.value] || {};
	$: filesCount = Object.keys(filepaths).length;

	function handleUpdate() {
		debounce(() => {
			error = validateFormat(value, granularity, format.id);
			triggerRerender?.update((n) => n + 1);

			settings.update((s) => {
				const updatedFormat = {
					...s.formats[format.id],
					value,
					error
				};
				console.log(updatedFormat);
				s.formats[format.id] = updatedFormat;
				if (selected) {
					s.selectedFormat = updatedFormat;
				}

				return s;
			});
		}, 500)();

		settings.update((s) => {
			s.formats[format.id].loading = true;

			return s;
		});
		debounce(() => {
			storeAllVaultPeriodicFilepaths(false, [granularity], { [format.id]: format });
			settings.update((s) => {
				s.formats[format.id].loading = false;

				return s;
			});
		}, 800)();
	}

	function handleSelect() {
		settings.update((s) => {
			if (type === 'skeleton') {
				const id = window.crypto.randomUUID();
				s.formats[id] = {
					id,
					value: '',
					error: '',
					loading: false
				};
			} else {
				// revalidate format on select since on:input debounce validation may not be triggered yet
				error = validateFormat(value, granularity, format.id);

				const newSelectedFormat = {
					...$settings.formats[format.id],
					value,
					error
				};
				s.selectedFormat = newSelectedFormat;
				s.formats[format.id] = newSelectedFormat;
			}
			return s;
		});
	}

	function handleReplaceAll(e: Event) {
		e.preventDefault();

		const replaceAll = () => {
			internalFileModStore.set('renamed');

			const oldFormats = $settings.formats;
			settings.update((s) => {
				// 1. select format
				s.selectedFormat = s.formats[format.id];
				return s;
			});

			// 2. rename all files
			let oldFormatsParsedCount = 0;
			Object.values(oldFormats).forEach(async (oldFormat) => {
				if (oldFormat.id === format.id) return;

				oldFormatsParsedCount += 1;

				const oldFilepaths = $settingsStore.filepathsByFormatValue[oldFormat.value] || {};
				const oldFilesCount = Object.keys(oldFilepaths).length;
				if (oldFilesCount) {
					settings.update((s) => {
						for (const f of Object.values(s.formats)) {
							s.formats[f.id].loading = true;
						}
						return s;
					});

					Object.keys(oldFilepaths).forEach(async (oldFilepath, oldFilepathIndex) => {
						const oldFile = window.app.vault.getAbstractFileByPath(oldFilepath) as TFile | null;
						const date = window.moment(oldFile?.basename, oldFormat.value, true);
						const newNormalizedPath = getNotePath(granularity, date, format, oldFile?.parent?.path);

						await ensureFolderExists(newNormalizedPath);
						if (oldFile) {
							try {
								await window.app.vault.rename(oldFile, newNormalizedPath);

								settingsStore.renameFilepath({
									oldData: {
										path: oldFilepath,
										formatValue: oldFormat.value,
										toBeDeleted: true
									},
									newData: {
										path: newNormalizedPath,
										formatValue: format.value,
										toBeAdded: true
									}
								});

								// one format is always omitted as its the target format and we avoid renaming it's filepaths unnecessarily
								if (
									oldFormatsParsedCount === Object.keys(oldFormats).length - 1 &&
									oldFilepathIndex === oldFilesCount - 1
								) {
									settings.update((s) => {
										for (const f of Object.values(s.formats)) {
											s.formats[f.id].loading = false;
										}
										return s;
									});
									internalFileModStore.set(null);
								}
							} catch (error) {
								new Notice(
									genNoticeFragment([
										[`Failed to rename ${oldFilepath} to ${newNormalizedPath}: `],
										[error.message, 'u-pop']
									]),
									8000
								);

								// one oldFormat is always omitted as its the target format
								if (
									oldFormatsParsedCount === Object.keys(oldFormats).length - 1 &&
									oldFilepathIndex === oldFilesCount - 1
								) {
									settings.update((s) => {
										for (const f of Object.values(s.formats)) {
											s.formats[f.id].loading = false;
										}
										return s;
									});
									internalFileModStore.set(null);
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
			settings.update((s) => {
				delete s.formats[format.id];

				// helps ensure at least one format is selected at all times
				if (selected && Object.keys(s.formats).length > 0) {
					s.selectedFormat = Object.values(s.formats)[0];
				}
				// helps ensure at least one non-empty valid format exists at all times
				const lastFormatEmpty =
					Object.keys(s.formats).length === 1 && Object.values(s.formats)[0].value.trim() === '';
				if (Object.keys(s.formats).length === 0 || lastFormatEmpty) {
					const id = window.crypto.randomUUID();
					const newSelectedFormat = {
						id,
						value: defaultFormat,
						error: '',
						loading: false
					};
					s.selectedFormat = newSelectedFormat;
					s.formats[id] = newSelectedFormat;
				}

				return s;
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
			error = validateFormat(value, granularity, format.id);
			trySelectLastOnlyFormat();

			// set icons
			setIcon(replaceBttnEl, 'replace-all');
			setIcon(removeBttnEl, 'x');
		}
	});

	function trySelectLastOnlyFormat() {
		if (Object.keys($settings.formats).length === 1) {
			settings.update((s) => ({
				...s,
				selectedFormat: Object.values(s.formats)[0]
			}));
		}
	}

	$: {
		if ($triggerRerender) {
			console.log('🔁 rerendering', granularity, value, format.id);
			error = validateFormat(value, granularity, format.id);
		}
	}

	$: if (error) {
		settings.update((s) => {
			if (formatId === s.selectedFormat.id) {
				s.selectedFormat.error = error;
			}
			s.formats[formatId].error = error;

			return s;
		});
	}

	$: if (labelEl) {
		labelEl.tabIndex = 0;
		labelEl.onkeydown = (event) => {
			if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
				selected = true;
				handleSelect();
			}
		};
	}
</script>

<!-- Format Option -->
<label
	bind:this={labelEl}
	class={clsx(
		'w-full cursor-pointer block rounded-lg p-3 mb-4 last:mb-0 border border-solid focus-visible:shadow-[0_0_0_3px_var(--background-modifier-border-focus)] outline-none',
		type === 'skeleton' &&
			'hover:bg-[var(--background-modifier-hover)] relative border-dashed hover:border-solid bg-transparent',
		error
			? 'border-[var(--background-modifier-error)]'
			: selected
			? 'bg-[var(--interactive-accent)] text-[var(--text-on-accent)] border-transparent'
			: 'hover:bg-[var(--background-modifier-hover)] border-[var(--background-modifier-border)] focus-visible:bg-[var(--background-modifier-hover)] focus-visible:border-[var(--background-modifier-border)]'
	)}
>
	{#if type === 'skeleton'}
		<button tabindex="-1" class="opacity-0 hidden" on:click={handleSelect} />
	{:else}
		<input type="radio" name="format" checked={selected} on:click={handleSelect} class="hidden" />
	{/if}

	<div class={clsx('w-full transition-all duration-200', type === 'skeleton' && 'opacity-0 -z-50')}>
		<div class="flex items-center mb-2">
			<input
				type="text"
				bind:value
				spellcheck={false}
				placeholder={defaultFormat}
				aria-invalid={!!error}
				aria-describedby={error ? 'format-error' : undefined}
				class={clsx(
					'flex-1 hover:transition bg-transparent ',
					type === 'skeleton' && 'opacity-0 -z-50',
					error
						? 'text-[var(--text-error)] border-[var(--background-modifier-error)]'
						: selected
						? 'placeholder-[var(--text-on-accent)] border-[var(--text-accent-hover)] hover:bg-[var(--interactive-accent-hover)]'
						: 'border-[var(--background-modifier-border-hover)] hover:bg-[var(--background-modifier-form-field)]'
				)}
				on:input={handleUpdate}
				disabled={type === 'skeleton'}
			/>
		</div>

		<div class="flex items-center justify-between pl-[1px]">
			<div class="[font-size:calc(var(--font-ui-small)+1px)]">
				<FilepathsCount {format} {selected} {error} />
				{#if error}
					<span class="text-[var(--text-error)]">{window.moment().format(value)} • </span>
					<span class="text-[var(--text-error)]" id="format-error">
						{error}
					</span>
				{:else}
					<span class={clsx(selected ? 'text-[var(--text-on-accent)]' : 'u-pop')}
						>{value.trim() ? window.moment().format(value) : 'Empty format'}</span
					>
				{/if}
			</div>
			<div class="flex">
				<!-- replace -->
				<button
					class={clsx(
						'clickable-icon extra-setting-button cursor-pointer',
						(error || value.trim() === '') &&
							'!cursor-not-allowed hover:bg-transparent hover:opacity-70',
						error ? 'text-[var(--text-error)]' : selected ? 'text-[var(--text-on-accent)]' : '',
						type === 'skeleton' && 'opacity-0 -z-50'
					)}
					aria-label="Replace all formats with this one"
					bind:this={replaceBttnEl}
					on:click={handleReplaceAll}
					disabled={!!error || value.trim() === '' || type === 'skeleton'}
				/>
				<!-- remove -->
				<button
					class={clsx(
						'clickable-icon extra-setting-button cursor-pointer',
						error ? 'text-[var(--text-error)]' : selected ? 'text-[var(--text-on-accent)]' : '',
						type === 'skeleton' ? 'opacity-0 -z-50' : ''
					)}
					aria-label="Remove format"
					bind:this={removeBttnEl}
					on:click={handleRemove}
					disabled={type === 'skeleton'}
				/>
			</div>
		</div>
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
