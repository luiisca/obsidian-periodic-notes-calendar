<script lang="ts">
    import { validateTemplate } from "@/io/validation";
    import { type PeriodSettings } from "@/settings";
    import { onDestroy, onMount } from "svelte";
    import type { Readable } from "svelte/store";
    import { cn } from "@/ui/utils";
    import { FileSuggest } from "../../suggest";

    interface Props {
        settings: Readable<PeriodSettings>;
    }

    let { settings }: Props = $props();

    let inputEl: HTMLInputElement;
    let value: string = $state($settings.templatePath || "");
    let error: string = $state("");
    let fileSuggestInstance: FileSuggest;

    onMount(() => {
        error = validateTemplate(value);
        fileSuggestInstance = new FileSuggest(inputEl);
    });
    onDestroy(() => {
        console.log("onDestroy");
        fileSuggestInstance?.destroy();
    });
</script>

<div class="setting-item">
    <div class="setting-item-info">
        <div class="setting-item-name">Template</div>
        <div class="setting-item-description">
            Choose a file to use as template
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
            placeholder="e.g. templates/template-file"
            oninput={() => {
                error = validateTemplate(value);
                if (error.trim() === "") {
                    $settings.templatePath =
                        value.trim() +
                        (!value.trim().endsWith(".md") ? ".md" : "");
                }
            }}
        />
    </div>
</div>
