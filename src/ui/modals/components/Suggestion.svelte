<script lang="ts">
    import { PeriodSettings, TFormat } from "@/settings";
    import Button from "./button.svelte";
    import { Writable } from "svelte/store";

    interface Props {
        filepath?: string;
        onMove: () => Promise<void>;
        onDelete: () => Promise<void>;
        settingsStore: Writable<PeriodSettings>;
        format: TFormat;
    }

    let {
        filepath = "",
        onMove,
        onDelete,
        settingsStore,
        format,
    }: Props = $props();

    const basename = filepath.split("/").pop() || "";
    const path = filepath.substring(0, filepath.lastIndexOf("/"));
    let loading = $derived($settingsStore.formats[format.id].loading);
</script>

<div class="px-0 flex justify-between items-center">
    <div class="flex items-baseline">
        <span class="font-medium">{basename}</span>
        {#if path}
            <span class="opacity-70 [font-size:var(--font-ui-smaller)] h-4 ml-2"
                >in {path}</span
            >
        {/if}
    </div>
    <div class="flex items-center space-x-1">
        <Button
            {loading}
            onClick={async () => {
                !loading && (await onMove());
            }}
            ariaLabel="Move note"
            icon="lucide-folder-input"
        />
        <Button
            {loading}
            onClick={async () => {
                !loading && (await onDelete());
            }}
            className="is-warning"
            ariaLabel="Delete note"
            icon="lucide-trash-2"
        />
    </div>
</div>
