<script lang="ts">
    import { getFileData } from "@/io";
    import { settingsStore } from "@/settings";
    import { displayedDateStore, yearsRanges } from "@/stores";
    import DateNavigator from "./DateNavigator.svelte";
    import { todayStore } from "@/stores/dates";
    import { Header } from "./core";

    let monthFileData = $state(getFileData("month", $displayedDateStore));
    let yearFileData = $state(
        getFileData("year", $displayedDateStore.clone().startOf("year")),
    );
    $effect.pre(() => {
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
    {#snippet bottomNavSnippet()}
        <DateNavigator
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
    {/snippet}
</Header>
