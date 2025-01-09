<script lang="ts">
    import { Writable } from "svelte/store";
    import Button from "./button.svelte";
    import { PeriodSettings, TFormat } from "@/settings";

    interface Props {
        handleMoveAll: (e: MouseEvent | KeyboardEvent) => void;
        handleDeleteAll: () => void;
        settingsStore: Writable<PeriodSettings>;
        format: TFormat;
    }
    let { handleMoveAll, handleDeleteAll, settingsStore, format }: Props =
        $props();
</script>

<div class="flex justify-between items-center p-[24px] pb-0">
    <span class="font-medium">Notes</span>
    <div class="flex items-center">
        <Button
            loading={$settingsStore.formats[format.id].loading}
            onClick={handleMoveAll}
            ariaLabel="Move all notes"
            className="py-[var(--size-4-1)] px-[var(--size-4-2)]"
            icon="lucide-folder-input">Move all</Button
        >
        <Button
            loading={$settingsStore.formats[format.id].loading}
            onClick={handleDeleteAll}
            ariaLabel="Delete all notes"
            className="py-[var(--size-4-1)] px-[var(--size-4-2)] is-warning"
            icon="lucide-trash-2">Delete all</Button
        >
    </div>
</div>
