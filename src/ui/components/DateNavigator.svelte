<script lang="ts">
	import { capitalize } from '@/utils';
	import Arrow from './Arrow.svelte';
	import Dot from './Dot.svelte';
	import { cn } from '../utils';

	interface Props {
		showingCrrDate: boolean;
		type: string;
		decrementdisplayedDate: () => void;
		resetdisplayedDate: () => void;
		incrementdisplayedDate: () => void;
	}

	let {
		showingCrrDate,
		type,
		decrementdisplayedDate,
		resetdisplayedDate,
		incrementdisplayedDate
	}: Props = $props();
</script>

<div class="flex items-center -ml-1" id="bottom-nav">
	<Arrow
		direction="left"
		onClick={decrementdisplayedDate}
		tooltip={`Previous ${capitalize(type)}`}
	/>
	<button
		class={cn(
			'[&:not(:focus-visible)]:shadow-none text-[--color-arrow] flex items-center p-2',
			showingCrrDate ? 'opacity-100' : 'opacity-60'
		)}
		id="reset-button"
		onclick={resetdisplayedDate}
		aria-label={!showingCrrDate ? `Current ${capitalize(type)}` : null}
	>
		<Dot className="h-[8px] w-[8px]" isFilled={showingCrrDate} />
	</button>
	<Arrow direction="right" onClick={incrementdisplayedDate} tooltip={`Next ${capitalize(type)}`} />
</div>

<style lang="postcss">
	@tailwind base;
	@tailwind utilities;
</style>
