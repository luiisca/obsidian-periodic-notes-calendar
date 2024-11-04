<script lang="ts">
	import { getPeriodicityFromGranularity, IGranularity } from '@/io';
	import { capitalize } from '@/utils';

	export let granularity: IGranularity;
	export let filepath: string;
	export let formatValue: string;
	export let error: string;

	const periodicity = capitalize(getPeriodicityFromGranularity(granularity));
</script>

<p class="text-[--text-warning]">Warning: {error}</p>
<p>
	This file <span class="u-pop">{filepath}</span> will not be recognized as a<span class="u-pop">
		{' ' + periodicity + ' '}
	</span>note. Please use a different format.
</p>
<p class="flex justify-between">
	<span class="u-pop">File path: {filepath}</span>
	<span class="u-pop">Format value: {formatValue}</span>
</p>

<style lang="postcss">
	@tailwind utilities;
	p {
		@apply m-0;
	}
</style>
