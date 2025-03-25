<script lang="ts">
    import { YEARS_RANGE_SIZE } from "@/constants";
    import { displayedDateStore, todayStore, yearsRanges } from "@/stores";
    import DateNavigator from "./DateNavigator.svelte";
    import { Header } from "./core";
    import { getContext } from "svelte";
    import { cn } from "../utils";
    import { Platform } from "obsidian";

    let showingCurrentRange: boolean = $derived(
        $yearsRanges.todayRange ===
            $yearsRanges.ranges[$yearsRanges.crrRangeIndex],
    );
    let crrRange = $derived(
        $yearsRanges.ranges[$yearsRanges.crrRangeIndex].split("-"),
    );

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

<Header>
    {#snippet leftTitleSnippet()}
        <div
            id="years-range"
            class={cn(
                "!text-[--color-text-header-title] text-6xl font-semibold",
                minimalMode?.value || Platform.isPhone ? "text-xl" : "text-7xl",
            )}
        >
            {crrRange[0].slice(2)} - {crrRange[1].slice(2)}
        </div>
    {/snippet}

    {#snippet bottomNavSnippet()}
        <DateNavigator
            showingCrrDate={showingCurrentRange}
            type="range"
            decrementdisplayedDate={() => {
                yearsRanges.updateRanges({
                    action: "decrement",
                    displayedDateModifier: -YEARS_RANGE_SIZE,
                });
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
                yearsRanges.updateRanges({ action: "increment" });
            }}
        />
    {/snippet}
</Header>
