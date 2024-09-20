<script lang="ts">
	import { get } from 'svelte/store';

	import { settingsStore } from '@/settings';
	import { createOrOpenNote, type IGranularity } from '@/io';
	import type { Moment } from 'moment';
	import { debounce } from 'obsidian';
	import { granularities } from '@/constants';
	import { getPeriodicityFromGranularity } from '@/io/parse';
	import { capitalize } from '@/utils';
	import type NldatePickerModal from '../modals/nldate-picker';
	import { onMount } from 'svelte';
	import type PeriodicNotesCalendarPlugin from '@/main';
	import { getNoteSettings } from '@/io/settings';

	export let modalClass: NldatePickerModal;
	export let pluginClass: PeriodicNotesCalendarPlugin;

	interface NldPlugin {
		parseDate: (dateString: string) => NldResult;
	}
	interface NldResult {
		formattedString: string;
		date: Date;
		moment: Moment;
	}
	const nldatesPlugin: NldPlugin = (<any>window.app).plugins.getPlugin('nldates-obsidian');

	const settings = get(settingsStore);
	let granularity: IGranularity = settings.crrNldModalGranularity;
	let dateInput = '';
	let parsedDate: Moment | null;

	$: format = getNoteSettings()[granularity].format;
	$: dateInput, format, debounce(getDateStr, 50)();

	let formattedDate: string = window
		.moment()
		.format(
			format || getNoteSettings()[granularity].format
		);

	const getDateStr = () => {
		let cleanDateInput = dateInput;

		if (dateInput.endsWith('|')) {
			cleanDateInput = dateInput.slice(0, -1);
		}

		formattedDate = 'Loading...';
		const nlParsedDate = nldatesPlugin.parseDate(cleanDateInput || 'today');

		if (nlParsedDate.moment.isValid()) {
			parsedDate = nlParsedDate.moment;
			formattedDate = nlParsedDate.moment.format(format);
		} else {
			parsedDate = null;
			formattedDate = 'Invalid date';
		}
	};

	// event handlers
	const enterKeyCb = (ev: KeyboardEvent) => {
		const target = ev.target as HTMLElement;

		if (ev.key === 'Enter' && target.className !== 'dropdown') {
			handleAccept();
		}

		if (document.getElementsByClassName('modal').length === 0) {
			window.removeEventListener('keydown', enterKeyCb);
		}
	};

	const handleCancel = async () => {
		modalClass.close();

		window.removeEventListener('keydown', enterKeyCb);
	};

	const handleAccept = async () => {
		if (parsedDate) {
			modalClass.close();

			const { workspace } = window.app;
			const leaf = workspace.getLeaf(false);

			createOrOpenNote({
				leaf,
				date: parsedDate,
				granularity,
				confirmBeforeCreateOverride: false
			});
		}
		window.removeEventListener('keydown', enterKeyCb);
	};
	const handleOnChange = (
		ev: Event & {
			currentTarget: EventTarget & HTMLSelectElement;
		}
	) => {
		pluginClass.saveSettings(() => ({
			crrNldModalGranularity: ev.currentTarget.value as IGranularity
		}));
	};

	onMount(() => {
		window.addEventListener('keydown', enterKeyCb);
	});
</script>

<div class="pt-4">
	<div class="setting-item border-0">
		<div class="setting-item-info">
			<div class="setting-item-name">Date</div>
			<div class="setting-item-description">{formattedDate}</div>
		</div>
		<div class="setting-item-control">
			<input bind:value={dateInput} type="text" spellcheck="false" placeholder="Today" />
		</div>
	</div>
	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">Date Format</div>
			<div class="setting-item-description">Moment format to be used</div>
		</div>
		<div class="setting-item-control">
			<input bind:value={format} type="text" spellcheck="false" placeholder="YYYY-MM-DD HH:mm" />
		</div>
	</div>
	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">Periodicity</div>
			<div class="setting-item-description">Type of periodic note to be created</div>
		</div>
		<div class="setting-item-control">
			<select bind:value={granularity} class="dropdown" on:change={handleOnChange}>
				{#each granularities as granularity}
					<option value={granularity}>
						{capitalize(getPeriodicityFromGranularity(granularity))}
					</option>
				{/each}
			</select>
		</div>
	</div>
	<div class="modal-button-container mt-3">
		<button class="cursor-pointer" on:click={handleCancel}>Never mind</button>
		<button
			class={`mod-cta ${parsedDate ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
			aria-disabled={!Boolean(parsedDate)}
			disabled={!Boolean(parsedDate)}
			on:click={handleAccept}>Open</button
		>
	</div>
</div>

<style lang="postcss">
	@tailwind components;
	@tailwind utilities;
</style>
