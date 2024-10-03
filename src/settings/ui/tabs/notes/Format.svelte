<script lang="ts">
	import { DEFAULT_FORMATS_PER_GRANULARITY } from '@/constants';
	import { type IGranularity } from '@/io';
	import { validateFormat } from '@/io/validation';
	import { type PeriodSettings } from '@/settings';
	import clsx from 'clsx';
	import { onMount } from 'svelte';
	import type { Readable } from 'svelte/store';
	export let granularity: IGranularity;
	export let settings: Readable<PeriodSettings>;

	const defaultFormat = DEFAULT_FORMATS_PER_GRANULARITY[granularity];
	let inputEl: HTMLInputElement;
	let value: string = $settings.format || '';
	let error: string;

	onMount(() => {
		error = validateFormat(inputEl.value, granularity);
	});
</script>

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
		<div class={clsx('setting-item-description', error ? 'has-error' : 'opacity-0')}>
			{error || 'Valid'}
		</div>
	</div>
	<div class="setting-item-control">
		<input
			bind:value
			bind:this={inputEl}
			class:has-error={!!error}
			type="text"
			spellcheck={false}
			placeholder={defaultFormat}
			on:input={() => {
				error = validateFormat(inputEl.value, granularity);
				if (error.trim() === '') {
					$settings.format = value.trim();
				}
			}}
		/>
	</div>
</div>

<style lang="postcss">
	@tailwind utilities;
</style>
