<script lang="ts">
	import { getFileData, getPeriodicityFromGranularity, type IGranularity } from '@/io';
	import type { Readable } from 'svelte/store';

    import {
        activeFilepathStore,
        displayedDateStore,
        todayStore,
        internalFileModStore,
    } from "@/stores/";
	import { type PeriodSettings, settingsStore } from '@/settings';
	import { Dropdown, HeadingsSuggest, SettingItem, Toggle } from '@/settings/ui';
	import { capitalize } from '@/utils';
	import { granularities } from '@/constants';
    import { debounce, TFile } from 'obsidian';
    import { mount, onDestroy, onMount } from 'svelte';

	interface Props {
		settings: Readable<PeriodSettings>;
		granularity: IGranularity;
	}

	let { settings, granularity }: Props = $props();
    let inputEl: HTMLInputElement | null = $state(null);
    let todoSectionValue: string = $state($settings.preview.todoSection || "");
    let headingsSuggestInstance: HeadingsSuggest;

    let headings = $derived.by(() => {
        const file = $settings.templatePath ? (window.app.vault.getAbstractFileByPath($settings.templatePath ) as TFile) : null;
        let h: string[] = []
        if (file) {
            h = window.app.metadataCache.getFileCache(file)?.headings?.map(h => (`${'#'.repeat(h.level)} ${h.heading}`)) || []
        }
        return h
    })
    $effect(() => {
        if (inputEl) {
            if (!headingsSuggestInstance) {
            headingsSuggestInstance = new HeadingsSuggest(inputEl)
            }
            headingsSuggestInstance.update(headings, $settings.templatePath)
        }
    })
    const handleOpenDestinationChange = (position: 'default' | 'below' | undefined) => {
        if (position) {
            $settings.preview.destination = position
        }
    }

    onDestroy(() => {
        headingsSuggestInstance?.destroy();
    });
</script>

<SettingItem
	name="Note Preview"
	type="toggle"
	isHeading={true}
>
	{#snippet control()}
		<Toggle
			isEnabled={$settings.preview.enabled}
			onChange={(val) => {
                $settings.preview.enabled = val
			}}
		/>
	{/snippet}
</SettingItem>

{#if $settings.preview.enabled}
    <!-- TODO: reword -->
    <SettingItem
        name="Main Section"
        description="The default section to open note preview at"
    >
        {#snippet control()}
            <input
                class="flex-grow"
                bind:value={$settings.preview.mainSection}
                bind:this={inputEl}
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
            bind:this={inputEl}
            type="text"
            spellcheck={false}
            placeholder="e.g. ## TODO"
        />
    {/snippet}
</SettingItem>

{#if $settings.preview.enabled}
    <!-- TODO: reword -->
    <SettingItem
        name="Where to Open Notes at"
        description="Choose whether to open notes on the default view (center) or in a preview (bottom below calendar UI)"
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
