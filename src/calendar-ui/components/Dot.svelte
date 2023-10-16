<script lang="ts">
	export let color: string = '';
	export let isFilled: boolean = false;
	export let isActive: boolean = false;
</script>

<svg
	class={`${$$restProps.class} inline-block h-[6px] w-[6px] mx-[1px] ${
		isActive ? 'text-[--text-on-accent]' : ''
	}`}
	style="color:{color}"
	viewBox="0 0 6 6"
	xmlns="http://www.w3.org/2000/svg"
>
	<circle
		stroke={!isFilled ? 'currentColor' : 'none'}
		fill={isFilled ? 'currentColor' : 'none'}
		cx="3"
		cy="3"
		r="2"
	/>
</svg>

<style>
	@tailwind components;
	@tailwind utilities;
</style>
