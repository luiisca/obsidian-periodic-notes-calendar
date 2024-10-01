<script lang="ts">
	import { validateTemplate } from '@/io/validation';
	import type { PeriodSettings } from '@/settings';
	import { onDestroy, onMount } from 'svelte';
	import type { Readable } from 'svelte/store';
	import { FileSuggest } from './suggest';

	export let settings: Readable<PeriodSettings>;

	let error: string;
	let inputEl: HTMLInputElement;
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
		<div class={`${error ? 'has-error' : 'opacity-0'} setting-item-description`}>
			{error || 'Valid'}
		</div>
	</div>
	<div class="setting-item-control">
		<input
			class="flex-grow"
			bind:value={$settings.templatePath}
			bind:this={inputEl}
			class:has-error={!!error}
			type="text"
			spellcheck={false}
			placeholder="e.g. templates/template-file"
			on:input={() => (error = validateTemplate(inputEl.value))}
		/>
	</div>
</div>

<style lang="postcss">
	@tailwind utilities;
</style>
