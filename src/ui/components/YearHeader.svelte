<script lang="ts">
    import { getFileData } from "@/io";
    import { settingsStore } from "@/settings";
    import { displayedDateStore, yearsRanges } from "@/stores";
    import { todayStore } from "@/stores/dates";
    import { getContext } from "svelte";
    import { Header } from "./core";
    import DateNavigator from "./DateNavigator.svelte";
    import { cn } from "../utils";

    let fileData = $derived.by(() => {
        $settingsStore.filepaths; // trigger reactivity
        return getFileData("year", $displayedDateStore);
    });
    let isToday = $derived($displayedDateStore.isSame($todayStore, "year"));

    $effect.pre(() => {
        if ($displayedDateStore) {
            // add new ranges or update existing ones every time displayed date changes
            yearsRanges.selectOrCreateRanges();
        }
    });

    let minimalMode = getContext("minimalMode") as
        | { value: boolean }
        | undefined;
    let isMobile = (window.app as any).isMobile;
</script>

<Header
    leftDate={$displayedDateStore}
    leftTitle={{
        granularity: "year",
        fileData,
        formatValue: "YYYY",
    }}
>
    {#snippet rightTitleSnippet()}
        <button
            class={cn(
                "text-[--interactive-accent] font-medium hover:!shadow-[0px_0px_0px_6px_var(--interactive-hover)] rounded-[2px]",
                minimalMode?.value || isMobile ? "text-sm" : "text-lg",
            )}
            id="years-range"
        >
            {$yearsRanges.ranges[$yearsRanges.crrRangeIndex]}
        </button>
    {/snippet}

    {#snippet bottomNavSnippet()}
        <DateNavigator
            showingCrrDate={isToday}
            type="year"
            decrementdisplayedDate={() => {
                displayedDateStore.update((date) =>
                    date.clone().subtract(1, "year"),
                );
            }}
            resetdisplayedDate={() => {
                yearsRanges.update((values) => ({
                    ...values,
                    crrRangeIndex: values.ranges.findIndex(
                        (range) => range === values.todayRange,
                    ),
                }));

                displayedDateStore.set($todayStore);
            }}
            incrementdisplayedDate={() => {
                displayedDateStore.update((date) =>
                    date.clone().add(1, "year"),
                );
            }}
        />
    {/snippet}
</Header>
