<script lang="ts">
    import { STICKER_POPOVER_ID } from "@/constants";
    import { cn, initializePicker } from "../utils";
    import { themeStore, spFileDataStore } from "@/stores";
    import { Platform } from "obsidian";

    let pickerContainerEl: HTMLDivElement | null = $state(null);
    $effect(() => {
        if (pickerContainerEl && $themeStore && $spFileDataStore) {
            initializePicker(pickerContainerEl, $themeStore, $spFileDataStore);
        }
    });
</script>

<div
    class={cn(
        "bg-transparent w-max opacity-0 pointer-events-none absolute",
        Platform.isPhone
            ? "!top-0 !left-1/2 [transform:translate(-50%,3%)_!important]"
            : " top-0 left-0",
    )}
    data-popover={true}
    id={STICKER_POPOVER_ID}
    bind:this={pickerContainerEl}
></div>

<style lang="postcss">
    #emoji-modal {
        padding: 0px;
        min-width: unset;
        width: unset !important;
    }
</style>
