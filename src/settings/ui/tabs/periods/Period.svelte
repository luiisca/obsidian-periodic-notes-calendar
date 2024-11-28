<script lang="ts">
    import { getPeriodicityFromGranularity, type IGranularity } from "@/io";
    import { PeriodSettings, settingsStore } from "@/settings";
    import { Arrow, Toggle } from "@/settings/ui/";
    import { capitalize } from "@/utils";
    import writableDerived from "svelte-writable-derived";
    import { slide } from "svelte/transition";
    import Folder from "./Folder.svelte";
    import Template from "./Template.svelte";
    import OpenAtStartup from "./OpenAtStartup.svelte";
    import Formats from "./Formats.svelte";
    import Preview from "./Preview.svelte";
    import { cn } from "@/ui/utils";

    interface Props {
        granularity: IGranularity;
    }

    let { granularity }: Props = $props();

    let isExpanded = $state(false);
    let isOpaque = $state(false);

    let settings = writableDerived(
        settingsStore,
        // get derived store from settingsStore
        ($settingsStore) => $settingsStore.periods[granularity],
        // update settingsStore when the derived store changes
        (reflecting, old) => {
            const newSettings = {
                ...old,
                periods: {
                    ...old.periods,
                    [granularity]: reflecting,
                },
            };

            return newSettings;
        },
    );

    function toggleExpand(event: MouseEvent | KeyboardEvent) {
        if ((event.target as HTMLElement)?.matches("input, label")) return;

        isExpanded = !isExpanded;
    }

    const handleEnableToggle = (enabled: boolean) => {
        $settings.enabled = enabled;

        switch (granularity) {
            case "day":
                if (
                    !$settings.enabled &&
                    !$settingsStore.periods.month.enabled &&
                    !$settingsStore.periods.year.enabled
                ) {
                    $settings.enabled = true;
                }
                if (!$settings.enabled && $settingsStore.periods.week.enabled) {
                    settingsStore.update((s) => {
                        s.periods.week.enabled = false;
                        return s;
                    });
                }
                break;

            case "week":
                if ($settings.enabled && !$settingsStore.periods.day.enabled) {
                    settingsStore.update((s) => {
                        s.periods.day.enabled = true;
                        return s;
                    });
                }

                break;

            case "month":
                if (
                    !$settings.enabled &&
                    $settingsStore.periods.quarter.enabled
                ) {
                    settingsStore.update((s) => {
                        s.periods.quarter.enabled = false;
                        return s;
                    });
                }
                break;

            case "quarter":
                if (
                    $settings.enabled &&
                    !$settingsStore.periods.month.enabled
                ) {
                    settingsStore.update((s) => {
                        s.periods.month.enabled = true;
                        return s;
                    });
                }

                break;

            default:
                break;
        }

        const enabledGranularities: IGranularity[] = [];
        let isCrrGranularityValid = false;
        for (const [g, s] of Object.entries($settingsStore.periods) as [
            IGranularity,
            PeriodSettings,
        ][]) {
            if (s.enabled) {
                if ($settingsStore.preview.crrGranularity === g) {
                    isCrrGranularityValid = true;
                }
                enabledGranularities.push(g);
            }
        }
        settingsStore.update((s) => {
            s.preview.enabledGranularities = enabledGranularities;
            if (!isCrrGranularityValid) {
                s.preview.crrGranularity = enabledGranularities[0];
            }
            return s;
        });
    };

    $effect.pre(() => {
        switch (granularity) {
            case "day":
                if (
                    !$settings.enabled &&
                    !$settingsStore.periods.month.enabled &&
                    !$settingsStore.periods.year.enabled
                ) {
                    $settings.enabled = true;
                }
                break;

            case "week":
                isOpaque = !$settingsStore.periods.day.enabled;
                break;

            case "quarter":
                isOpaque = !$settingsStore.periods.month.enabled;
                break;

            default:
                break;
        }
    });
</script>

<div
    class={cn(
        "bg-[var(--background-secondary)] border border-solid border-[var(--background-modifier-border)] rounded-[var(--modal-radius)] mb-6 last:mb-0",
        isOpaque && "opacity-50",
    )}
>
    <a
        href="./"
        class="setting-item setting-item-heading text-transparent !p-6 cursor-pointer flex items-center justify-between focus-visible:shadow-[0_0_0_3px_var(--background-modifier-border-focus)] outline-none hover:text-transparent"
        onclick={toggleExpand}
    >
        <div class="setting-item-info flex justify-between items-center">
            <h3
                class="setting-item-name flex items-center text-lg font-semibold m-0"
            >
                <Arrow {isExpanded} />
                <span class="ml-2">
                    {capitalize(getPeriodicityFromGranularity(granularity))} Notes
                </span>
                {#if $settings.openAtStartup}
                    <span
                        class="ml-4 mt-1 text-[var(--text-muted)] text-xs italic font-medium"
                        >Opens at startup</span
                    >
                {/if}
            </h3>
        </div>
        <div class="setting-item-control">
            <Toggle
                isEnabled={$settings.enabled}
                onChange={handleEnableToggle}
            />
        </div>
    </a>
    {#if isExpanded}
        <div
            class="p-6"
            in:slide|local={{ duration: 300 }}
            out:slide|local={{ duration: 300 }}
        >
            <Formats {settings} {granularity} />
            <Folder {settings} {granularity} />
            <Template {settings} />
            <OpenAtStartup {settings} {granularity} />
            <Preview {settings} {granularity} />
        </div>
    {/if}
</div>
