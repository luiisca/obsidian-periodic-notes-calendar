<script lang="ts">
    import {
        LoadingCircle,
        settingsStore,
        type PeriodSettings,
    } from "@/settings";
    import { FilepathModal } from "@/ui/modals/filepath-select";
    import { cn } from "@/ui/utils";
    import { Writable } from "svelte/store";

    interface Props {
        settings: Writable<PeriodSettings>;
        format: PeriodSettings["formats"][number];
        selected?: boolean;
        error?: string;
        separator?: string;
    }

    let {
        settings,
        format,
        selected = false,
        error = "",
        separator = " • ",
    }: Props = $props();

    let filepaths = $derived(
        $settingsStore.filepathsByFormatValue[format.value] || {},
    );
    let filesCount = $derived(
        Object.keys($settingsStore.filepathsByFormatValue[format.value] || {})
            .length,
    );
    let _selected = $derived(selected);

    function handleClick(e: MouseEvent) {
        e.preventDefault();
        !format.loading &&
            new FilepathModal(Object.keys(filepaths), settings, format).open();
    }
</script>

{#if filesCount || format.loading}
    <div class="relative inline-flex">
        <LoadingCircle loading={format.loading} />
        <a
            class={cn(
                "[font-size:calc(var(--font-ui-small)+1px)] focus-visible:shadow-[0_0_0_3px_var(--background-modifier-border-focus)]",
                error
                    ? "!text-[var(--text-error)] hover:opacity-85"
                    : _selected
                      ? "opacity-100 hover:opacity-85 !text-[var(--text-on-accent)]"
                      : "u-pop",
                format.loading && "opacity-60",
            )}
            href={null}
            onclick={handleClick}
        >
            {filesCount || "-"}
            {filesCount === 1 ? "File" : "Files"}
        </a>
    </div>
    {separator}
{/if}
