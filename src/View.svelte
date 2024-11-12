<script lang="ts">
    import "./app.css";
    import { cn } from "@/ui/utils";
    import { onDestroy, setContext } from "svelte";
    import { CALENDAR_POPOVER_ID } from "./constants";
    import { displayedDateStore } from "./stores";
    import Calendar from "./ui/components/Calendar.svelte";
    import { todayStore } from "./stores/dates";
    import { settingsStore } from "./settings";

    interface Props {
        popover?: boolean;
    }

    let { popover = false }: Props = $props();
    let minimalMode = $state({ value: false });

    $effect.pre(() => {
        if (popover) {
            minimalMode.value = $settingsStore.floatingViewAlwaysMinimal;
        } else {
            minimalMode.value = $settingsStore.minimalMode;
        }
    });

    setContext("minimalMode", minimalMode);

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
                "bg-transparent z-[var(--layer-menu)] w-max opacity-0 pointer-events-none absolute top-0 left-0",
        )}
        data-popover={popover}
        id={CALENDAR_POPOVER_ID}
    >
        <div class="ml-[5px] p-2 pr-0 w-[clamp(320px,_35vw,_500px)]">
            <div
                class="[border:1px_solid_var(--background-modifier-border-hover)] bg-[var(--background-secondary)] rounded-[var(--radius-m)] [box-shadow:var(--shadow-s)] p-[var(--size-2-3)]"
            >
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
