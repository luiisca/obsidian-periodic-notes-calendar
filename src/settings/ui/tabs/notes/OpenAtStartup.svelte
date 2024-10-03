<script lang="ts">
	import { getPeriodicityFromGranularity, type IGranularity } from '@/io';
	import type { Readable } from 'svelte/store';

	import { type PeriodSettings, settingsStore } from '@/settings';
	import { SettingItem, Toggle } from '@/settings/ui';
	import { capitalize } from '@/utils';
	import { granularities } from '@/constants';

	export let settings: Readable<PeriodSettings>;
	export let granularity: IGranularity;
</script>

<SettingItem
	name="Open on startup"
	description={`Opens your ${capitalize(
		getPeriodicityFromGranularity(granularity)
	)} note automatically whenever you open this vault`}
	type="toggle"
	isHeading={false}
>
	<Toggle
		slot="control"
		isEnabled={$settings.openAtStartup}
		onChange={(val) => {
			settingsStore.update((settings) => {
				const newSettings = settings;
				for (const granularity of granularities) {
					newSettings.notes[granularity].openAtStartup = false;
				}

				return newSettings;
			});
			$settings.openAtStartup = val;
		}}
	/>
</SettingItem>
