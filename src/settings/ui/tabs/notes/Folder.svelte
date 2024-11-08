<script lang="ts">
    import { getPeriodicityFromGranularity, type IGranularity } from "@/io";
    import { validateFolder } from "@/io/validation";
    import { capitalize } from "@/utils";
    import { onDestroy, onMount } from "svelte";
    import type { Readable } from "svelte/store";
    import { type PeriodSettings, FolderSuggest } from "@/settings";
    import { cn } from "@/ui/utils";

    interface Props {
        settings: Readable<PeriodSettings>;
        granularity: IGranularity;
    }

    let { settings, granularity }: Props = $props();

    let inputEl: HTMLInputElement;
    let value: string = $state("");
    let error: string = $derived(validateFolder(value));
    let folderSuggestInstance: FolderSuggest;

    $effect.pre(() => {
        value = $settings.folder;
    });

    onMount(() => {
        folderSuggestInstance = new FolderSuggest(inputEl);
        console.log("on folder Mount", folderSuggestInstance);
    });
    onDestroy(() => {
        console.log("onDestroy", folderSuggestInstance);
        folderSuggestInstance?.destroy();
    });
</script>

<div class="setting-item">
    <div class="setting-item-info">
        <div class="setting-item-name">Folder</div>
        <div class="setting-item-description">
            New {capitalize(getPeriodicityFromGranularity(granularity))} notes will
            be placed here
        </div>
        <div
            class={cn(
                "setting-item-description",
                error ? "has-error" : "opacity-0",
            )}
        >
            {error || "Valid"}
        </div>
    </div>
    <div class="setting-item-control">
        <input
            class="flex-grow"
            bind:value
            bind:this={inputEl}
            class:has-error={!!error}
            type="text"
            spellcheck={false}
            placeholder="e.g. folder 1/folder 2"
            oninput={() => {
                if (error.trim() === "") {
                    $settings.folder = value.trim();
                }
            }}
        />
    </div>
</div>
