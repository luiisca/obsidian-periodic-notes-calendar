<script lang="ts">
	export let className: string = '';
	export let isVisible: boolean = true;
	export let isFilled: boolean = false;
	export let isActive: boolean = false;
</script>

<svg
	class={`dot ${className}`}
	class:isVisible
	class:isFilled
	class:isActive
	viewBox="0 0 6 6"
	xmlns="http://www.w3.org/2000/svg"
>
	<circle cx="3" cy="3" r="2" />
</svg>

<style lang="postcss">
	.dot {
		display: inline-block;
		height: 6px;
		width: 6px;
		margin: 0 1px;
		fill: none;
	}
	.isVisible {
		stroke: var(--color-dot);
	}

	.isActive {
		stroke: var(--text-on-accent);
	}

	.isFilled {
		fill: var(--color-dot);
	}

	.isActive.isFilled {
		fill: var(--text-on-accent);
	}
</style>
