<script lang="ts">
    import { getFileData } from "@/io";
    import { settingsStore } from "@/settings";
    import { displayedDateStore, yearsRanges } from "@/stores";
    import { todayStore } from "@/stores/dates";
    import { getContext } from "svelte";
    import { Header } from "./core";
    import DateNavigator from "./DateNavigator.svelte";
    import { cn } from "../utils";
    import { Platform } from "obsidian";

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
</script>

<Header
    leftDate={$displayedDateStore}
    leftTitle={{
        granularity: "year",
        fileData,
        formatValue: "YY",
    }}
>
    {#snippet rightTitleSnippet()}
        <div
            id="years-range"
            class={cn(
                "font-medium rounded-[2px]",
                minimalMode?.value || Platform.isPhone ? "text-sm" : "text-lg",
            )}
        >
            {$yearsRanges.ranges[$yearsRanges.crrRangeIndex]}
        </div>
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
