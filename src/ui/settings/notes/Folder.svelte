<script lang="ts">
	import { getPeriodicityFromGranularity, type IGranularity } from '@/io';
	import { validateFolder } from '@/io/validation';
	import { capitalize } from '@/utils';
	import { onDestroy, onMount } from 'svelte';
	import type { Readable } from 'svelte/store';
	import { FolderSuggest } from './suggest';
	import type { PeriodSettings } from '@/settings';

	export let settings: Readable<PeriodSettings>;
	export let granularity: IGranularity;

	let inputEl: HTMLInputElement;
	let error: string;
	let folderSuggestInstance: FolderSuggest;

	onMount(() => {
		error = validateFolder(inputEl.value);
		folderSuggestInstance = new FolderSuggest(inputEl);
	});
	onDestroy(() => {
		console.log('onDestroy');
		folderSuggestInstance.destroy();
	});
</script>

<div class="setting-item">
	<div class="setting-item-info">
		<div class="setting-item-name">Folder</div>
		<div class="setting-item-description">
			New {capitalize(getPeriodicityFromGranularity(granularity))} notes will be placed here
		</div>
		<div class={`${error ? 'has-error' : 'opacity-0'} setting-item-description`}>
			{error || 'Valid'}
		</div>
	</div>
	<div class="setting-item-control">
		<input
			class="flex-grow"
			bind:value={$settings.folder}
			bind:this={inputEl}
			class:has-error={!!error}
			type="text"
			spellcheck={false}
			placeholder="e.g. folder 1/folder 2"
			on:input={() => (error = validateFolder(inputEl.value))}
		/>
	</div>
</div>

<style lang="postcss">
	@tailwind utilities;
</style>
