<script lang="ts">
	export let onClick: () => void;
	export let tooltip: string;
	export let direction: 'left' | 'right';

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let isMobile = (window.app as any).isMobile;
</script>

<button
	class="[&:not(:focus-visible)]:shadow-none flex items-center {direction === 'right'
		? 'rotate-180'
		: ''} {isMobile ? 'w-8' : 'w-6'}"
	on:click={onClick}
	aria-label={tooltip}
>
	<svg
		class="h-4 w-4 text-[--color-arrow]"
		focusable="false"
		role="img"
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 320 512"
		><path
			fill="currentColor"
			d="M34.52 239.03L228.87 44.69c9.37-9.37 24.57-9.37 33.94 0l22.67 22.67c9.36 9.36 9.37 24.52.04 33.9L131.49 256l154.02 154.75c9.34 9.38 9.32 24.54-.04 33.9l-22.67 22.67c-9.37 9.37-24.57 9.37-33.94 0L34.52 272.97c-9.37-9.37-9.37-24.57 0-33.94z"
		/></svg
	>
</button>

<style>
	@tailwind base;
	@tailwind components;
	@tailwind utilities;

	button {
		background-color: transparent;
	}
</style>
