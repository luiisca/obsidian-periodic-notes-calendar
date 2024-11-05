<script lang="ts">
    import { run } from "svelte/legacy";

    import { getFileData } from "@/io";
    import { settingsStore } from "@/settings";
    import { displayedDateStore, yearsRanges } from "@/stores";
    import DateNavigator from "./DateNavigator.svelte";
    import Header from "./Header.svelte";
    import { todayStore } from "@/stores/dates";

    run(() => {
        if ($displayedDateStore) {
            // add new ranges or update existing ones every time displayed date changes
            yearsRanges.selectOrCreateRanges();
        }
    });

    let fileData = $state(getFileData("year", $displayedDateStore));
    run(() => {
        if ($settingsStore.filepaths) {
            fileData = getFileData("year", $displayedDateStore);
        }
    });
    let isToday = $derived($displayedDateStore.isSame($todayStore, "year"));
</script>

<Header
    leftTitle={{
        date: $displayedDateStore,
        granularity: "year",
        fileData,
        formatValue: "YYYY",
    }}
>
    <button
        slot="right-title"
        class="[&:not(:focus-visible)]:shadow-none text-[--interactive-accent] font-medium opacity-60"
        id="years-range"
    >
        {$yearsRanges.ranges[$yearsRanges.crrRangeIndex]}
    </button>
    <DateNavigator
        slot="bottom-nav"
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
            displayedDateStore.update((date) => date.clone().add(1, "year"));
        }}
    />
</Header>

<style lang="postcss">
    @tailwind base;
    @tailwind utilities;
</style>
