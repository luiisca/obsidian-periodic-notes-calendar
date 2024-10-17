<script lang="ts">
	import { DEFAULT_FORMATS_PER_GRANULARITY } from '@/constants';
	import { getContext, onMount } from 'svelte';
	import clsx from 'clsx';
	import { type Writable } from 'svelte/store';
	import { type IGranularity } from '@/io';
	import { settingsStore, type PeriodSettings } from '@/settings';
	import { validateFormat } from '@/io/validation';
	import { debounce, setIcon } from 'obsidian';
	import { createConfirmationDialog } from '@/ui/modals/confirmation';
	import { INotesContext } from '@/ui/types';

	export let index: number = 0;
	export let settings: Writable<PeriodSettings>;
	export let format: PeriodSettings['formats'][number] = {
		id: '',
		value: '',
		filePaths: [],
		error: ''
	};
	export let granularity: IGranularity = 'day';
	export let type: 'default' | 'skeleton' = 'default';

	const defaultFormat = DEFAULT_FORMATS_PER_GRANULARITY[granularity];
	let removeBttnEl: HTMLElement;
	let replaceBttnEl: HTMLElement;
	let value = format.value || '';
	let error = format.error || '';
	$: selected = type === 'skeleton' ? false : format.id === $settings.selectedId;
	let { triggerRerender } = getContext<INotesContext>('notesContext');

	// Mock data
	const previewDate = new Date().toLocaleDateString();
	const filesCount = Math.round(Math.random() * 100);

	function handleUpdate() {
		console.log('🌿 ~ handleUpdate ~ value', value);
		error = validateFormat(value, granularity, format.id);
		triggerRerender?.update((n) => n + 1);

		settings.update((settings) => ({
			...settings,
			formats: [
				...settings.formats.slice(0, index),
				{
					...settings.formats[index],
					value,
					error
				},
				...settings.formats.slice(index + 1)
			]
		}));

		if (selected) {
			settings.update((settings) => ({
				...settings,
				format: value
			}));
		}
	}

	function handleSelect() {
		if (type === 'skeleton') {
			settings.update((settings) => {
				return {
					...settings,
					formats: [
						...settings.formats,
						{
							id: window.crypto.randomUUID(),
							value: '',
							filePaths: [],
							error: ''
						}
					]
				};
			});
		} else {
			error = validateFormat(value, granularity, format.id);

			settings.update((settings) => ({
				...settings,
				selectedId: format.id,
				format: value,
				formats: [
					...settings.formats.slice(0, index),
					{
						...settings.formats[index],
						error
					},
					...settings.formats.slice(index + 1)
				]
			}));
			console.log('👉 on select', $settings.formats);
		}
	}

	function handleReplace(e: Event) {
		e.preventDefault();

		// 1. select format
		settings.update((settings) => ({
			...settings,
			format: format.value
		}));
		// 2. go through all formats, and through all their files, extract their date object and reformat it with
		// new crr format
		// for (const [format, filePaths] of $settings.formats) {
		// 	for (const filePath of filePaths) {
		//               const date =
		// 	}
		// }

		// 3. remove all formats except crr one
		settings.update((settings) => ({
			...settings,
			formats: [{ ...settings.formats[index] }]
		}));
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
				if (newSettings.selectedId === format.id && newSettings.formats.length > 0) {
					newSettings = {
						...newSettings,
						format: newSettings.formats[0].value,
						selectedId: newSettings.formats[0].id
					};
				}
				// helps ensure at least one format exists at all times
				const lastFormatEmpty =
					newSettings.formats.length === 1 && newSettings.formats[0].value.trim() === '';
				if (newSettings.formats.length === 0 || lastFormatEmpty) {
					const id = window.crypto.randomUUID();
					newSettings = {
						...newSettings,
						format: defaultFormat,
						selectedId: id,
						formats: [
							{
								id,
								value: defaultFormat,
								filePaths: [],
								error: ''
							}
						]
					};
				}

				return newSettings;
			});

			trySelectLastOnlyFormat();

			triggerRerender?.update((n) => n + 1);
		};

		if (filesCount > 0) {
			const shouldConfirm = $settingsStore.shouldConfirmBeforeDeleteFormat;
			// TODO: reword
			if (shouldConfirm) {
				createConfirmationDialog({
					title: `Delete format`,
					text: `Are you sure you want to delete this format? There are ${filesCount} files using it.`,
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
				selectedId: settings.formats[0].id,
				format: settings.formats[0].value
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
				on:input={debounce(handleUpdate, 500)}
			/>
			<div class="flex space-x-1">
				<!-- replace -->
				<button
					class="clickable-icon extra-setting-button cursor-pointer"
					aria-label="Replace all formats with this one"
					bind:this={replaceBttnEl}
					on:click={handleReplace}
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

		{#if error}
			<p class="mt-2 text-xs text-red-500" id="format-error">
				{error}
			</p>
		{:else}
			<p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
				{previewDate} • {filesCount} Files
			</p>
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
