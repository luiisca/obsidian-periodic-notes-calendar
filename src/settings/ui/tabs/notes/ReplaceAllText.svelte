<script lang="ts">
	import { getPeriodicityFromGranularity, IGranularity } from '@/io';
	import { capitalize } from '@/utils';

	export let replacingFormat: string;
	export let granularity: IGranularity;

	const periodicity = capitalize(getPeriodicityFromGranularity(granularity));
</script>

<p>
	All existing {periodicity} notes (if any) will be renamed to match this format:
	<span class="u-pop">{replacingFormat}</span>.
</p>
<p class="u-pop">⚠️ This action cannot be undone</p>
