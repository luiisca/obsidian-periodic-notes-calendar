<script lang="ts">
    import { getPeriodicityFromGranularity, type IGranularity } from "@/io";
    import type { Readable } from "svelte/store";

    import { type PeriodSettings, settingsStore } from "@/settings";
    import { SettingItem, Toggle } from "@/settings/ui";
    import { capitalize } from "@/utils";
    import { granularities } from "@/constants";

    interface Props {
        settings: Readable<PeriodSettings>;
        granularity: IGranularity;
    }

    let { settings, granularity }: Props = $props();
</script>

<SettingItem
    name="Open on startup"
    description={`Automatically open or create a new ${capitalize(
        getPeriodicityFromGranularity(granularity),
    )} note whenever you open this vault.`}
    type="toggle"
    isHeading={false}
>
    {#snippet control()}
        <Toggle
            isEnabled={$settings.openAtStartup}
            onChange={(val) => {
                settingsStore.update((settings) => {
                    const newSettings = settings;
                    for (const granularity of granularities) {
                        newSettings.periods[granularity].openAtStartup = false;
                    }

                    return newSettings;
                });
                $settings.openAtStartup = val;
            }}
        />
    {/snippet}
</SettingItem>
