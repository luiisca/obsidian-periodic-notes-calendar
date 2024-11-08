<script lang="ts">
    import { capitalize, getDailyNotesPlugin } from "@/utils";
    import { getPeriodicityFromGranularity } from "./parse";
    import { DnPluginSettings, getNormalizedPeriodSettings } from "./settings";
    import { IGranularity } from "./types";

    interface Props {
        granularity: IGranularity;
    }
    const { granularity }: Props = $props();

    const periodicity = capitalize(getPeriodicityFromGranularity(granularity));
    let dnPlugin: DnPluginSettings | undefined = $state();
    let dnPluginLoaded = $state(false);
    $effect.pre(() => {
        getDailyNotesPlugin().then((p) => {
            dnPlugin = p;
            dnPluginLoaded = true;
        });
    });
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
    {#if granularity === "day" && dnPluginLoaded && !dnPlugin?.enabled}
        (Daily Notes plugin disabled)
    {/if}
{/if}
