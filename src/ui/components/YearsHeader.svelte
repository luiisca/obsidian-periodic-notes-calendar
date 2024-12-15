<script lang="ts">
    import { YEARS_RANGE_SIZE } from "@/constants";
    import { displayedDateStore, todayStore, yearsRanges } from "@/stores";
    import DateNavigator from "./DateNavigator.svelte";
    import { Header } from "./core";
    import { getContext } from "svelte";
    import { cn } from "../utils";

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
    let isMobile = (window.app as any).isMobile;
</script>

<Header>
    {#snippet leftTitleSnippet()}
        <div
            class={cn(
                "text-[--color-text-title] text-6xl font-semibold",
                minimalMode?.value || isMobile ? "text-xl" : "text-7xl",
            )}
            id="years range"
        >
            {crrRange[0]} - {crrRange[1].slice(2)}
        </div>
    {/snippet}

    {#snippet bottomNavSnippet()}
        <DateNavigator
            showingCrrDate={showingCurrentRange}
            type="range"
            decrementdisplayedDate={() => {
                console.log(
                    "decrementdisplayedYearRange() > yearsRanges store: ",
                    $yearsRanges,
                );

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
                console.log(
                    "incrementedisplayedDate() > yearsRanges store: ",
                    $yearsRanges,
                );

                yearsRanges.updateRanges({ action: "increment" });
            }}
        />
    {/snippet}
</Header>
