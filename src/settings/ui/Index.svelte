<script lang="ts">
    import { Calendar, Periods } from "@/settings/ui";
    import { Tabs } from "@/ui";
    import { tabs, selectedTabStore } from "./stores";
</script>

<div class="pnc-container">
    <Tabs 
        tabs={[...tabs]} 
        selectedTab={$selectedTabStore} 
        selectTab={(tab: typeof tabs[number]) => selectedTabStore.set(tab)} 
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

<style lang="postcss">
    :global(.vertical-tab-content) {
        scrollbar-gutter: stable;
        padding-right: calc(
            1rem + 16px
        ); /* 1rem (16px) for base padding + 16px for scrollbar */
    }
</style>
