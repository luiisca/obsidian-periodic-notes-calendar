<script lang="ts">
    import "@/app.css";
    import { CALENDAR_POPOVER_ID } from "@/constants";
    import { settingsStore } from "@/settings";
    import {
        displayedDateStore,
        mainLeafStore,
        previewLeafStore,
        todayStore,
    } from "@/stores";
    import { ViewManager } from "@/ui";
    import { cn } from "@/ui/utils";
    import { onDestroy, setContext } from "svelte";
    import Calendar from "../Calendar.svelte";
    import { Platform } from "obsidian";

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

    let heartbeat = setInterval(() => {
        // update today
        let wasCrrMonthDisplayed =
            $todayStore.month() === $displayedDateStore.month();
        todayStore.set(window.moment());

        // update displayedDateStore to new current date only if new current date is one month ahead.
        if (
            wasCrrMonthDisplayed &&
            $todayStore
                .clone()
                .startOf("month")
                .isSame(
                    $displayedDateStore
                        .clone()
                        .add(1, "month")
                        .startOf("month"),
                )
        ) {
            displayedDateStore.set($todayStore);
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
        <div class="ml-[5px] p-2 pr-0 w-[clamp(320px,_35vw,_350px)]">
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
    {#if $previewLeafStore?.isOpenBttnVisible}
        <div
            id="pnc-container"
            class={cn(
                "absolute left-0 w-full",
                $mainLeafStore?.splitPos === "right" ? "bottom-11" : "bottom-8",
            )}
        >
            <div
                id="preview-open-bttn-container"
                class="[border-top:var(--tab-outline-width)_solid_var(--tab-outline-color)] relative mx-3"
            >
                <button
                    id="preview-open-bttn"
                    class={cn(
                        "clickable-icon view-action italic absolute [transform:translateY(-50%)] w-fit cursor-pointer py-3 hover:!bg-transparent",
                        Platform.isPhone
                            ? "!bg-[var(--mobile-sidebar-background)] hover:!bg-[var(--mobile-sidebar-background)]"
                            : "!bg-[var(--background-secondary)] hover:!bg-[var(--background-secondary)]",
                        $mainLeafStore?.splitPos === "left" && "left-0 pr-3",
                        $mainLeafStore?.splitPos === "root" &&
                            "left-1/2 [transform:translate(-50%,-50%)] px-3 !bg-[var(--background-primary)] hover:!bg-[var(--background-primary)]",
                        $mainLeafStore?.splitPos === "right" && "right-0 pl-3",
                    )}
                    onclick={async () => {
                        ViewManager.tryInitPreview(undefined, true);
                    }}>Open preview</button
                >
            </div>
        </div>
    {/if}
{/if}

<style lang="postcss">
    @tailwind utilities;
</style>
