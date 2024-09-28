<script lang="ts">
	import { getPeriodicityFromGranularity, IGranularity } from '@/io';
	import { validateFolder } from '@/io/validation';
	import { PeriodSettings } from '@/settings';
	import { capitalize } from '@/utils';
	import { onDestroy, onMount } from 'svelte';
	import type { Readable } from 'svelte/store';
	import { FolderSuggest } from './suggest';

	export let settings: Readable<PeriodSettings>;
	export let granularity: IGranularity;

	let inputEl: HTMLInputElement;
	let error: string;
	let folderSuggestInstance: FolderSuggest;

	function onChange() {
		error = validateFolder(inputEl.value);
	}

	function clearError() {
		error = '';
	}

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
		<div class="setting-item-name">Note Folder</div>
		<div class="setting-item-description">
			New {capitalize(getPeriodicityFromGranularity(granularity))} notes will be placed here
		</div>
		{#if error}
			<div class="has-error">{error}</div>
		{/if}
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
			on:change={onChange}
			on:input={clearError}
		/>
	</div>
</div>
