<script lang="ts">
    import {
        DEFAULT_DAILY_NOTE_FORMAT,
        granularities,
        NLDATES_PLUGIN_ID,
    } from "@/constants";
    import { createOrOpenNote, IGranularity } from "@/io";
    import { getPeriodicityFromGranularity } from "@/io/parse";
    import { getNormalizedPeriodSettings } from "@/io/settings";
    import { LoadingCircle, settingsStore } from "@/settings";
    import { capitalize, getPlugin } from "@/utils";
    import type { Moment } from "moment";
    import { debounce } from "obsidian";
    import type NldatePickerModal from "../modals/nldate-picker";
    import { NldPlugin } from "../modals/nldate-picker";

    interface Props {
        modalClass: NldatePickerModal;
        nlDatesPlugin: NldPlugin;
    }

    let { modalClass, nlDatesPlugin }: Props = $props();

    let nlDateInputVal = $state("today");
    let granularityInputVal: IGranularity = $state("day");
    let formatInputVal = $state(DEFAULT_DAILY_NOTE_FORMAT);
    let parsedDate: Moment | null = $state(window.moment());
    let formattedDate: string = $derived(
        parsedDate?.format(formatInputVal) || "",
    );

    let loading = $state(false);
    let error = $state("");

    $effect.pre(() => {
        granularityInputVal = $settingsStore.crrNldModalGranularity;
    });

    const handleNlDateChange = (
        event: Event & {
            currentTarget: EventTarget & HTMLInputElement;
        },
    ) => {
        nlDateInputVal = event.currentTarget.value;

        const parseDate = async () => {
            let cleanDateInput = nlDateInputVal;

            if (nlDateInputVal.endsWith("|")) {
                cleanDateInput = nlDateInputVal.slice(0, -1);
            }

            loading = true;
            const nlParsedDate = nlDatesPlugin.parseDate(
                cleanDateInput || "today",
            );
            loading = false;

            if (nlParsedDate.moment.isValid()) {
                parsedDate = nlParsedDate.moment;
                error = "";
            } else {
                parsedDate = null;
                error = "Invalid date";
            }
        };

        debounce(parseDate, 50)();
    };

    const handleGranularityChange = () => {
        formatInputVal =
            getNormalizedPeriodSettings(granularityInputVal).settings
                .selectedFormat.value;

        settingsStore.update((settings) => ({
            ...settings,
            crrNldModalgranularityInputVal: granularityInputVal,
        }));
    };

    const handleCancel = async () => {
        modalClass.close();
    };

    const handleAccept = async () => {
        if (parsedDate) {
            modalClass.close();

            const { workspace } = window.app;
            const leaf = workspace.getLeaf(false);

            createOrOpenNote({
                leaf,
                date: parsedDate,
                granularity: granularityInputVal,
                confirmBeforeCreateOverride: false,
            });
        }
    };
</script>

<div class="pt-4">
    <div class="setting-item border-0">
        <div class="setting-item-info">
            <div class="setting-item-name">Date</div>
            <div class="setting-item-description relative">
                {#if loading}
                    <LoadingCircle {loading} />
                {/if}
                {#if error}
                    <span class="text-[var(--text-error)]">
                        {error}
                    </span>
                {:else}
                    <span>{formattedDate}</span>
                {/if}
            </div>
        </div>
        <div class="setting-item-control">
            <input
                oninput={handleNlDateChange}
                type="text"
                spellcheck="false"
                placeholder="Today"
            />
        </div>
    </div>
    <div class="setting-item">
        <div class="setting-item-info">
            <div class="setting-item-name">Date Format</div>
            <div class="setting-item-description">Moment format to be used</div>
        </div>
        <div class="setting-item-control">
            <input
                bind:value={formatInputVal}
                type="text"
                spellcheck="false"
                placeholder="YYYY-MM-DD HH:mm"
            />
        </div>
    </div>
    <div class="setting-item">
        <div class="setting-item-info">
            <div class="setting-item-name">Periodicity</div>
            <div class="setting-item-description">
                Type of periodic note to be created
            </div>
        </div>
        <div class="setting-item-control">
            <select
                bind:value={granularityInputVal}
                class="dropdown"
                onchange={handleGranularityChange}
            >
                {#each granularities as g}
                    <option value={g}>
                        {capitalize(getPeriodicityFromGranularity(g))}
                    </option>
                {/each}
            </select>
        </div>
    </div>
    <div class="modal-button-container mt-3">
        <button class="cursor-pointer" onclick={handleCancel}>Never mind</button
        >
        <button
            class={`mod-cta ${parsedDate ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
            aria-disabled={!parsedDate}
            disabled={!parsedDate}
            onclick={handleAccept}>Open</button
        >
    </div>
</div>
