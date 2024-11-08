<script lang="ts">
    import { run } from "svelte/legacy";

    import { getFileData } from "@/io";
    import { settingsStore } from "@/settings";
    import { displayedDateStore, yearsRanges } from "@/stores";
    import DateNavigator from "./DateNavigator.svelte";
    import Header from "./Header.svelte";
    import { todayStore } from "@/stores/dates";

    let monthFileData = $state(getFileData("month", $displayedDateStore));
    let yearFileData = $state(
        getFileData("year", $displayedDateStore.clone().startOf("year")),
    );
    run(() => {
        if ($settingsStore.filepaths) {
            monthFileData = getFileData("month", $displayedDateStore);

            yearFileData = getFileData(
                "year",
                $displayedDateStore.clone().startOf("year"),
            );
        }
    });
    let isToday = $derived($displayedDateStore.isSame($todayStore, "month"));
</script>

<Header
    leftTitle={{
        date: $displayedDateStore,
        granularity: "month",
        fileData: monthFileData,
        formatValue: "MMM",
    }}
    rightTitle={{
        date: $displayedDateStore.clone().startOf("year"),
        granularity: "year",
        fileData: yearFileData,
        formatValue: "YYYY",
    }}
>
    <DateNavigator
        slot="bottom-nav"
        showingCrrDate={isToday}
        type="month"
        decrementdisplayedDate={() => {
            displayedDateStore.update((date) =>
                date.clone().subtract(1, "month"),
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
            displayedDateStore.update((date) => date.clone().add(1, "month"));
        }}
    />
</Header>
