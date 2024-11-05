<script lang="ts">
    import { run } from "svelte/legacy";

    import { YEARS_RANGE_SIZE } from "@/constants";
    import { displayedDateStore, yearsRanges } from "@/stores";
    import DateNavigator from "./DateNavigator.svelte";
    import Header from "./Header.svelte";

    const todayMoment = window.moment();

    let showingCurrentRange: boolean = $state();
    run(() => {
        $displayedDateStore,
            (() => {
                showingCurrentRange =
                    $yearsRanges.todayRange ===
                    $yearsRanges.ranges[$yearsRanges.crrRangeIndex];

                // add new ranges or update existing ones every time displayed date changes
                yearsRanges.selectOrCreateRanges();
            })();
    });
    let crrRange = $derived(
        $yearsRanges.ranges[$yearsRanges.crrRangeIndex].split("-"),
    );
</script>

<Header>
    <div
        slot="left-title"
        class="text-[--color-text-title] text-[4rem] [&:not(:focus-visible)]:shadow-none font-semibold"
        id="years range"
    >
        {crrRange[0]} - {crrRange[1].slice(2)}
    </div>

    <DateNavigator
        slot="bottom-nav"
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

            displayedDateStore.set(todayMoment.clone());
        }}
        incrementdisplayedDate={() => {
            console.log(
                "incrementedisplayedDate() > yearsRanges store: ",
                $yearsRanges,
            );

            yearsRanges.updateRanges({ action: "increment" });
        }}
    />
</Header>
