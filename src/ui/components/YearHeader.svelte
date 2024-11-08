<script lang="ts">
    import { getFileData } from "@/io";
    import { settingsStore } from "@/settings";
    import { displayedDateStore, yearsRanges } from "@/stores";
    import { todayStore } from "@/stores/dates";
    import DateNavigator from "./DateNavigator.svelte";
    import Header from "./Header.svelte";

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
        class="text-[--interactive-accent] font-medium text-lg hover:!shadow-[0px_0px_0px_6px_var(--interactive-hover)] rounded-[2px]"
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
