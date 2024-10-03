<script lang="ts">
	import { validateTemplate } from '@/io/validation';
	import { type PeriodSettings } from '@/settings';
	import { onDestroy, onMount } from 'svelte';
	import type { Readable } from 'svelte/store';
	import clsx from 'clsx';
	import { FileSuggest } from '../../suggest';

	export let settings: Readable<PeriodSettings>;

	let inputEl: HTMLInputElement;
	let value: string = $settings.templatePath || '';
	let error: string;
	let fileSuggestInstance: FileSuggest;

	onMount(() => {
		error = validateTemplate(inputEl.value);
		fileSuggestInstance = new FileSuggest(inputEl);
	});
	onDestroy(() => {
		console.log('onDestroy');
		fileSuggestInstance.destroy();
	});
</script>

<div class="setting-item">
	<div class="setting-item-info">
		<div class="setting-item-name">Template</div>
		<div class="setting-item-description">Choose a file to use as template</div>
		<div class={clsx('setting-item-description', error ? 'has-error' : 'opacity-0')}>
			{error || 'Valid'}
		</div>
	</div>
	<div class="setting-item-control">
		<input
			class="flex-grow"
			bind:value
			bind:this={inputEl}
			class:has-error={!!error}
			type="text"
			spellcheck={false}
			placeholder="e.g. templates/template-file"
			on:input={() => {
				error = validateTemplate(inputEl.value);
				if (error.trim() === '') {
					$settings.templatePath = value.trim();
				}
			}}
		/>
	</div>
</div>

<style lang="postcss">
	@tailwind utilities;
</style>
