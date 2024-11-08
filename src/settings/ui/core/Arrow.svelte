<script lang="ts">
    import { setIcon } from "obsidian";
    import { onMount } from "svelte";
    import { fade } from "svelte/transition";

    interface Props {
        isExpanded: boolean;
    }

    let { isExpanded }: Props = $props();
    let arrowEl: HTMLElement;

    onMount(() => {
        setIcon(arrowEl, "chevron-right");
    });
</script>

<div
    bind:this={arrowEl}
    class={`flex items-center mr-2 transition-transform duration-200 ease-in ${
        isExpanded ? "rotate-90" : ""
    }`}
    transition:fade
></div>
