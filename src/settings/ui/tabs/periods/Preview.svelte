<script lang="ts">
    import { type IGranularity } from "@/io";
    import type { Readable } from "svelte/store";

    import { settingsStore, type PeriodSettings } from "@/settings";
    import { Dropdown, HeadingsSuggest, SettingItem } from "@/settings/ui";
    import { TFile } from "obsidian";
    import { onDestroy } from "svelte";
    import { PluginService } from "@/app-service";

    interface Props {
        settings: Readable<PeriodSettings>;
        granularity: IGranularity;
    }

    let { settings }: Props = $props();
    let mainSectionInputEl: HTMLInputElement | null = $state(null);
    let todoSectionInputEl: HTMLInputElement | null = $state(null);
    let mainHeadingSuggestInstance: HeadingsSuggest;
    let todoHeadingSuggestInstance: HeadingsSuggest;

    let headings = $derived.by(() => {
        $settings.preview.mainSection; // force update
        $settings.preview.todoSection; // force update
        const file = $settings.templatePath
            ? (PluginService.getPlugin()?.app.vault.getAbstractFileByPath(
                  $settings.templatePath,
              ) as TFile)
            : null;
        let h: string[] = [];
        if (file) {
            h =
                PluginService.getPlugin()
                    ?.app.metadataCache.getFileCache(file)
                    ?.headings?.map(
                        (h) => `${"#".repeat(h.level)} ${h.heading}`,
                    ) || [];
        }
        return h;
    });
    $effect(() => {
        if (mainSectionInputEl) {
            if (!mainHeadingSuggestInstance) {
                mainHeadingSuggestInstance = new HeadingsSuggest(
                    mainSectionInputEl,
                );
            }
            $settings.preview.mainSection; // force update
            mainHeadingSuggestInstance.update(headings, $settings.templatePath);
        }
        if (todoSectionInputEl) {
            if (!todoHeadingSuggestInstance) {
                todoHeadingSuggestInstance = new HeadingsSuggest(
                    todoSectionInputEl,
                );
            }
            $settings.preview.todoSection; // force update
            todoHeadingSuggestInstance.update(headings, $settings.templatePath);
        }
    });

    const handleOpenDestinationChange = (
        position: "default" | "below" | undefined,
    ) => {
        if (position) {
            $settings.preview.destination = position;
        }
    };

    onDestroy(() => {
        mainHeadingSuggestInstance?.destroy();
        todoHeadingSuggestInstance?.destroy();
    });
</script>

<SettingItem isHeading={true} name="Preview" />
{#if $settingsStore.preview.enabled}
    <SettingItem
        name="Main Section"
        description="Set the default section where note previews open. Leave empty to open from the top. Example: '## Links'."
    >
        {#snippet control()}
            <input
                class="flex-grow"
                bind:value={$settings.preview.mainSection}
                bind:this={mainSectionInputEl}
                type="text"
                spellcheck={false}
                placeholder="e.g. ## Links"
            />
        {/snippet}
    </SettingItem>
{/if}

<SettingItem
    name="Todo Section"
    description="Uncompleted tasks will be moved to this section in new periodic notes. Leave empty to disable. Searches up to 3 previous notes. Example: '## TODO'."
>
    {#snippet control()}
        <input
            class="flex-grow"
            bind:value={$settings.preview.todoSection}
            bind:this={todoSectionInputEl}
            type="text"
            spellcheck={false}
            placeholder="e.g. ## TODO"
        />
    {/snippet}
</SettingItem>

{#if $settingsStore.preview.enabled}
    <SettingItem
        name="Open Notes In"
        description="Choose whether notes open in the main section or in a preview below the calendar interface."
        type="dropdown"
    >
        {#snippet control()}
            <Dropdown
                options={[
                    { label: "Default", value: "default" },
                    { label: "Below", value: "below" },
                ]}
                onChange={handleOpenDestinationChange}
                value={$settings.preview.destination}
            />
        {/snippet}
    </SettingItem>
{/if}
