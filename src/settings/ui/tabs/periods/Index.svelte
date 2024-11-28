<script lang="ts">
    import { granularities } from "@/constants";
    import Period from "./Period.svelte";
    import { setContext } from "svelte";
    import { writable } from "svelte/store";

    setContext("notesContext", {
        triggerRerender: writable(0),
    });
</script>

<div>
    <div
        class="italic text-[var(--text-faint)] [font-size:var(--font-ui-small)] p-[var(--size-4-6)_var(--size-4-4)] pt-0"
    >
        Disabling these settings will hide the corresponding calendar sections,
        but you’ll still be able to create periodic notes from the command
        palette.
    </div>
    {#each granularities as granularity}
        <Period {granularity} />
    {/each}
</div>
