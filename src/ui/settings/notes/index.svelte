<script lang="ts">
	import { granularities } from '@/constants';
	import PeriodSettings from './Period.svelte';
</script>

<div>
	{#each granularities as granularity}
		<PeriodSettings {granularity} />
	{/each}
</div>
