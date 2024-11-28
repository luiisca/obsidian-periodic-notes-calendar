<script lang="ts">
    import { type IGranularity } from "@/io";
    import { type PeriodSettings } from "@/settings";
    import { type Writable } from "svelte/store";
    import Format from "./Format.svelte";
    interface Props {
        granularity: IGranularity;
        settings: Writable<PeriodSettings>;
    }

    let { granularity, settings }: Props = $props();

    let selectedFormat = $derived($settings.selectedFormat);

    function getExpectedTokens(granularity: IGranularity): string {
        const baseTokens = "Y or y (year)";
        switch (granularity) {
            case "quarter":
                return `${baseTokens}, Q (quarter)`;
            case "month":
                return `${baseTokens}, M (month)`;
            case "week":
                return `${baseTokens}, w or W (week)`;
            case "day":
                return `${baseTokens}, M (month) and D (day)`;
            default:
                return baseTokens;
        }
    }
</script>

<div class="setting-item flex flex-col">
    <div class="mb-4 w-full mr-0">
        <div class="setting-item-info">
            <div
                class="setting-item-name mb-2 flex items-center justify-between"
            >
                <span>Format</span>
                {#if selectedFormat.value.trim()}
                    <span
                        class={`${selectedFormat.error ? "text-[var(--text-error)]" : "u-pop"}`}
                        >{selectedFormat.value}</span
                    >
                {:else}
                    <span class="u-pop">Empty format</span>
                {/if}
            </div>
            <div class="setting-item-description">
                <p class="mt-0 mb-1">
                    Required tokens: <span class="u-pop"
                        >{getExpectedTokens(granularity)}</span
                    >
                </p>
                {#if selectedFormat.value.trim()}
                    <p class="mt-0 mb-1">
                        Preview: <span class="u-pop"
                            >{window
                                .moment()
                                .format(selectedFormat.value)}</span
                        >
                    </p>
                {/if}
                <a
                    class="focus-visible:shadow-[0_0_0_3px_var(--background-modifier-border-focus)]"
                    href="https://momentjs.com/docs/#/displaying/format/"
                    >Syntax Reference</a
                >
            </div>
        </div>
    </div>
    <form
        class="w-full"
        onsubmit={(e) => {
            e.preventDefault();
        }}
    >
        <fieldset role="radiogroup" class="border-none p-0 m-0">
            <legend class="sr-only">Choose a date format</legend>
            {#each Object.values($settings.formats) as format (format.id)}
                <Format {settings} {format} {granularity} />
            {/each}
            <Format {settings} type="skeleton" />
        </fieldset>
    </form>
</div>
