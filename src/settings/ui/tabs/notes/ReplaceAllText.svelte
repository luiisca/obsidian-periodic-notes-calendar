<script lang="ts">
	import { getPeriodicityFromGranularity, IGranularity } from '@/io';
	import { capitalize } from '@/utils';

	export let replacingFormat: string;
	export let granularity: IGranularity;

	const periodicity = capitalize(getPeriodicityFromGranularity(granularity));
</script>

<div>
	<p>
		This will rename all periodic notes in the current period to use the format <span class="u-pop"
			>{replacingFormat}</span
		>.
	</p>
	<ul>
		<li>
			All existing {periodicity} notes will be renamed to match this format
		</li>
		<li>Other {periodicity} formats will be removed</li>
		<li class="u-pop">⚠️ This action cannot be undone</li>
	</ul>
</div>
