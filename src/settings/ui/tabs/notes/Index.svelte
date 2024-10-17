<script lang="ts">
	import { granularities } from '@/constants';
	import Period from './Period.svelte';
	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';

	setContext('notesContext', {
		triggerRerender: writable(0)
	});
</script>

<div>
	{#each granularities as granularity}
		<Period {granularity} />
	{/each}
</div>

