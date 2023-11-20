<script lang="ts">
    export let srcs: string[];
</script>

<div class="flex space-x-2">
    {#each srcs as src}
        <img src={src} alt='gif demonstratating current option effect'/>
    {/each}
</div>

<style>
	@tailwind base;
	@tailwind components;
	@tailwind utilities;
</style>
