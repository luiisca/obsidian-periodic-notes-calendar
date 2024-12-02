<script lang="ts">
    import { setIcon } from "obsidian";
    import { onMount } from "svelte";

    let iconEl: HTMLElement;

    onMount(() => {
        setIcon(iconEl, "lucide-arrow-right");
    });
</script>

<span bind:this={iconEl}></span>
