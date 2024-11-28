<script lang="ts">
	import { type IGranularity } from '@/io';
	import type { Readable } from 'svelte/store';

    import { settingsStore, type PeriodSettings } from '@/settings';
    import { Dropdown, HeadingsSuggest, SettingItem, Toggle } from '@/settings/ui';
    import { TFile } from 'obsidian';
    import { onDestroy } from 'svelte';

	interface Props {
		settings: Readable<PeriodSettings>;
		granularity: IGranularity;
	}

	let { settings, granularity }: Props = $props();
    let mainSectionInputEl: HTMLInputElement | null = $state(null);
    let todoSectionInputEl: HTMLInputElement | null = $state(null);
    let mainHeadingSuggestInstance: HeadingsSuggest;
    let todoHeadingSuggestInstance: HeadingsSuggest;

    let headings = $derived.by(() => {
        const file = $settings.templatePath ? (window.app.vault.getAbstractFileByPath($settings.templatePath ) as TFile) : null;
        let h: string[] = []
        if (file) {
            h = window.app.metadataCache.getFileCache(file)?.headings?.map(h => (`${'#'.repeat(h.level)} ${h.heading}`)) || []
        }
        return h
    })
    $effect(() => {
        if (mainSectionInputEl) {
            if (!mainHeadingSuggestInstance) {
                mainHeadingSuggestInstance = new HeadingsSuggest(mainSectionInputEl)
            }
            mainHeadingSuggestInstance.update(headings, $settings.templatePath, mainSectionInputEl)
        }
        if (todoSectionInputEl) {
            if (!todoHeadingSuggestInstance) {
                todoHeadingSuggestInstance = new HeadingsSuggest(todoSectionInputEl)
            }
            todoHeadingSuggestInstance.update(headings, $settings.templatePath, todoSectionInputEl)
        }
    })

    const handleOpenDestinationChange = (position: 'default' | 'below' | undefined) => {
        if (position) {
            $settings.preview.destination = position
        }
    }

    onDestroy(() => {
        mainHeadingSuggestInstance?.destroy();
        todoHeadingSuggestInstance?.destroy();
    });
</script>

<SettingItem name="Preview" />
{#if $settingsStore.preview.enabled}
    <!-- TODO: reword -->
    <SettingItem
        name="Main Section"
        description="The default section to open note preview at"
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

<!-- TODO: reword -->
<SettingItem
    name="Todo Section"
    description="The plugin will automatically move uncompleted tasks under the selected section when a new periodic note is created. Leave empty to disable. It looks up to 3 periodic notes before"
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
    <!-- TODO: reword -->
    <SettingItem
        name="Where to Open Notes at"
        description="Choose whether to open notes on the default view (main) or in a preview (bottom below calendar UI)"
        type="dropdown"
    >
        {#snippet control()}
            <Dropdown
                options={[
                    { label: 'Default', value: 'default' },
                    { label: 'Below', value: 'below' }
                ]}
                onChange={handleOpenDestinationChange}
                value={$settings.preview.destination}
            />
        {/snippet}
    </SettingItem>
{/if}
