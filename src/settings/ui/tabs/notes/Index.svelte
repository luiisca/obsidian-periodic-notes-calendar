<script lang="ts">
	import { granularities } from '@/constants';
	import Period from './Period.svelte';
</script>

<div>
	{#each granularities as granularity}
		<Period {granularity} />
	{/each}
</div>
