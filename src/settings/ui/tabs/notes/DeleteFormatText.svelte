<script lang="ts">
	import FilepathsCount from './FilepathsCount.svelte';
	import { type PeriodSettings } from '@/settings';

	export let format: PeriodSettings['formats'][number];
</script>

<p>
	Are you sure you want to delete this format? There are <FilepathsCount {format} />
	using it.
</p>
