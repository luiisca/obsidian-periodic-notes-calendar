<script lang="ts">
	export let variable: number;
</script>

<div class="number">
	<span>My number is {variable}!</span>
	<div>
		<button on:click={() => variable -= 1}>-</button>
		<button on:click={() => variable += 1}>+</button>
	</div>
</div>

<style>
	.number {
		color: red;
	}
</style>
