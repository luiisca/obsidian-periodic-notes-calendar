<script lang="ts">
    import { YEARS_RANGE_SIZE } from "@/constants";
    import { displayedDateStore, yearsRanges } from "@/stores";
    import DateNavigator from "./DateNavigator.svelte";
    import Header from "./Header.svelte";

    const todayMoment = window.moment();

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
</script>

<Header>
    <div
        slot="left-title"
        class="text-[--color-text-title] text-6xl font-semibold"
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
