<script lang="ts">
    import { capitalize } from "@/utils";
    import { getPeriodicityFromGranularity } from "./parse";
    import { getNormalizedPeriodSettings } from "./settings";
    import { IGranularity } from "./types";
    import { DAILY_NOTES_PLUGIN_ID } from "@/constants";

    export let granularity: IGranularity;

    const periodicity = capitalize(getPeriodicityFromGranularity(granularity));
    const dailyNotesPluginEnabled = (<any>(
        window.app
    )).internalPlugins?.getPluginById(DAILY_NOTES_PLUGIN_ID).enabled;
    const { settings: periodSettings, type: periodSettingsType } =
        getNormalizedPeriodSettings(granularity);
</script>

{#if periodSettingsType === "period"}
    Note: Using {periodicity} format
    <span class="u-pop">{periodSettings.selectedFormat.value}</span>
{:else if periodSettingsType === "daily"}
    Note: Using Daily Notes plugin format <span class="u-pop"
        >{periodSettings.selectedFormat.value}</span
    >
{:else if periodSettingsType === "default"}
    Note: Using default format <span class="u-pop"
        >{periodSettings.selectedFormat.value}</span
    >
    {#if granularity === "day" && !dailyNotesPluginEnabled}
        (Daily Notes plugin disabled)
    {/if}
{/if}

<style lang="postcss">
    @tailwind base;
    @tailwind utilities;
</style>
