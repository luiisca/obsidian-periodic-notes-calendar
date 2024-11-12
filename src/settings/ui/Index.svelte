<script lang="ts">
    import { Notes, Calendar } from "@/settings/ui";
    import { Tabs } from "@/ui";

    const tabs = ["calendar", "notes"] as const;
    let selectedTab: (typeof tabs)[number] = $state("notes");
</script>

<div class="pnc-container">
    <Tabs tabs={[...tabs]} bind:selectedTab className="max-w-56" />
    <div class="mt-6">
        {#if selectedTab === "calendar"}
            <Calendar />
        {:else if selectedTab === "notes"}
            <Notes />
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
