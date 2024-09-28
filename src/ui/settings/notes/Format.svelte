<script lang="ts">
	import { DEFAULT_FORMATS_PER_GRANULARITY } from '@/constants';
	import { IGranularity } from '@/io';
	import { validateFormat } from '@/io/validation';
	import { PeriodSettings } from '@/settings';
	import { onMount } from 'svelte';
	import type { Readable } from 'svelte/store';
	export let granularity: IGranularity;
	export let settings: Readable<PeriodSettings>;

	const defaultFormat = DEFAULT_FORMATS_PER_GRANULARITY[granularity];
	let inputEl: HTMLInputElement;
	let error: string;

	$: value = $settings.format || '';

	onMount(() => {
		error = validateFormat(inputEl.value, granularity);
	});

	function clearError() {
		error = '';
	}

	function onChange() {
		error = validateFormat(inputEl.value, granularity);
	}
</script>

<div class="flex flex-col space-y-2">
	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">Format</div>
			<div class="setting-item-description">
				<a href="https://momentjs.com/docs/#/displaying/format/">Syntax Reference</a>
				<div>
					Your current syntax looks like this:
					<b class="u-pop">{window.moment().format(value || defaultFormat)}</b>
				</div>
			</div>
		</div>
		<div class="setting-item-control">
			<input
				bind:value={$settings.format}
				bind:this={inputEl}
				class:has-error={!!error}
				type="text"
				spellcheck={false}
				placeholder={defaultFormat}
				on:change={onChange}
				on:input={clearError}
			/>
		</div>
	</div>

	{#if error}
		<div class="has-error">{error}</div>
	{/if}
</div>
