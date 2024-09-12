<script lang="ts">
	export let className: string = '';
	export let isFilled: boolean = false;
	export let isActive: boolean = false;
</script>

<svg
	class={`dot ${className}`}
	class:isFilled
	class:isActive
	viewBox="0 0 6 6"
	xmlns="http://www.w3.org/2000/svg"
>
	<circle cx="3" cy="3" r="2" />
</svg>

<style>
	.dot {
		display: inline-block;
		height: 6px;
		width: 6px;
		margin: 0 1px;
		fill: none;
		stroke: var(--color-dot);
	}

	.active {
		stroke: var(--text-on-accent);
	}

	.filled {
		fill: var(--color-dot);
	}

	.active.filled {
		fill: var(--text-on-accent);
	}
</style>
