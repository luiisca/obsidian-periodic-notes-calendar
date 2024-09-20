<svelte:options immutable />

<script lang="ts">
	import { getNoteDateUID } from '@/io';
	import { displayedDateStore, notesStores } from '@/stores';
	import { eventHandlers, isControlPressed } from '../utils';
	import Dot from './Dot.svelte';
	import Sticker from './Sticker.svelte';

	export let quarterNum: number;

	const notesStore = notesStores['quarter'];

	$: date = $displayedDateStore.clone().quarter(quarterNum).startOf('quarter');
	$: noteDateUID = getNoteDateUID({ date, granularity: 'quarter' });
	$: file = $notesStore[noteDateUID]?.file;
	$: sticker = $notesStore[noteDateUID]?.sticker;
</script>

<td class="relative">
	<button
		id="period-num"
		on:click={(event) =>
			eventHandlers.onClick({
				date,
				createNewSplitLeaf: isControlPressed(event),
				granularity: 'quarter'
			})}
		on:contextmenu={(event) =>
			eventHandlers.onContextMenu({
				date,
				event,
				granularity: 'quarter'
			})}
		on:pointerenter={(event) =>
			eventHandlers.onHover({
				date,
				targetEl: event.target,
				isControlPressed: isControlPressed(event),
				granularity: 'quarter'
			})}
	>
		Q{quarterNum}
		<Dot isFilled={!!file} isActive={!!file} />
	</button>

	<Sticker {sticker} />
</td>

<style lang="postcss">
	@tailwind base;
	@tailwind components;
	@tailwind utilities;
</style>
