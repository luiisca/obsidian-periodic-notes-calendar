<script lang="ts">
    import { Calendar, Periods } from "@/settings/ui";
    import { Tabs } from "@/ui";
    import { tabs, selectedTabStore } from "./stores";
    import { onMount } from "svelte";

    let containerEl: HTMLDivElement | null = $state(null);

    onMount(() => {
        if (containerEl?.parentElement) {
            containerEl.parentElement.id = "pnc-settings-container";
        }
    });
</script>

<div id="pnc-container" bind:this={containerEl}>
    <Tabs
        tabs={[...tabs]}
        selectedTab={$selectedTabStore}
        selectTab={(tab: (typeof tabs)[number]) => selectedTabStore.set(tab)}
        className="max-w-56"
    />
    <div class="mt-6">
        {#if $selectedTabStore === "calendar"}
            <Calendar />
        {:else if $selectedTabStore === "periods"}
            <Periods />
        {/if}
    </div>
</div>
