<script lang="ts">
    import "./app.css";
    import { cn } from "@/ui/utils";
    import { onDestroy } from "svelte";
    import { CALENDAR_POPOVER_ID } from "./constants";
    import { displayedDateStore } from "./stores";
    import Calendar from "./ui/components/Calendar.svelte";
    import { todayStore } from "./stores/dates";

    interface Props {
        popover?: boolean;
    }

    let { popover = false }: Props = $props();

    export function rerenderCalendar() {
        // TODO: reimplement
        // rerenderStore.update((val) => ({
        // 	...val,
        // 	rerender: true
        // }));
    }

    let heartbeat = setInterval(() => {
        // update today
        todayStore.set(window.moment());

        // update displayedDateStore to new current date only if new current date is one day ahead.
        // useful to update display with new current month, year or years range automatically
        if ($todayStore.isSame($displayedDateStore.clone().add(1, "day"))) {
            console.log("⚙⚙⚙ RERENDERING CALENdAR ⚙⚙⚙️");

            displayedDateStore.set($todayStore);
            rerenderCalendar();
        }
    }, 1000 * 60);

    onDestroy(() => {
        clearInterval(heartbeat);
    });
</script>

{#if popover}
    <div
        class={cn(
            popover &&
                "bg-transparent z-10 w-max opacity-0 pointer-events-none absolute top-0 left-0",
        )}
        data-popover={popover}
        id={CALENDAR_POPOVER_ID}
    >
        <div
            id={`${CALENDAR_POPOVER_ID}-arrow`}
            class="rotate-45 absolute w-2.5 h-2.5 bg-slate-500"
        ></div>
        <div class="ml-[5px] p-2">
            <div class="bg-slate-500 rounded-sm">
                <Calendar />
            </div>
        </div>
    </div>
{/if}
{#if !popover}
    <Calendar />
{/if}

<style lang="postcss">
    @tailwind utilities;
</style>
