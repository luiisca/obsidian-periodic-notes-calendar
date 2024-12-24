<script lang="ts">
    import {
        getPeriodicityFromGranularity,
        storeAllVaultPeriodicFilepaths,
        type IGranularity,
    } from "@/io";
    import { validateFolder } from "@/io/validation";
    import { capitalize } from "@/utils";
    import { onDestroy, onMount } from "svelte";
    import { type PeriodSettings, FolderSuggest } from "@/settings";
    import { cn } from "@/ui/utils";
    import { debounce } from "obsidian";
    import { Writable } from "svelte/store";

    interface Props {
        settings: Writable<PeriodSettings>;
        granularity: IGranularity;
    }

    let { settings, granularity }: Props = $props();

    let inputEl: HTMLInputElement;
    let value: string = $state("");
    let error: string = $derived(validateFolder(value));
    let folderSuggestInstance: FolderSuggest;

    const handleInput = () => {
        const setLoading = (loading: boolean) => {
            settings.update((s) => {
                Object.values(s.formats).forEach((format) => {
                    s.formats[format.id].loading = loading;
                });

                return s;
            });
        };
        setLoading(true);
        $settings.folder = value.trim();
        debounce(() => {
            if (error.trim() === "") {
                storeAllVaultPeriodicFilepaths(true, [granularity]);
                setLoading(false);
            }
        }, 1000)();
    };

    $effect.pre(() => {
        value = $settings.folder;
    });

    onMount(() => {
        folderSuggestInstance = new FolderSuggest(inputEl);
    });
    onDestroy(() => {
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
                error ? "text-[var(--text-error)]" : "opacity-0",
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
            oninput={handleInput}
        />
    </div>
</div>
