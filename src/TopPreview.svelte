<script lang="ts">
    import { setIcon, TFile, WorkspaceLeaf } from "obsidian";
    import { onMount } from "svelte";
    import { BASE_POPOVER_ID } from "./constants";
    import { Popover } from "./ui/popovers";
    import { cn } from "./ui/utils";
    import { Outline } from "./ui/components/outline";
    import { previewLeafStore } from "./stores";

    let file: TFile | null = $state(null);
    let leaf: WorkspaceLeaf | null = $state(null);
    let outlineBttn: HTMLElement | null = $state(null);
    let outlineOpen = $state(false);

    const handleOutlineClick = (event: MouseEvent | KeyboardEvent) => {
        Popover.create({
            id: BASE_POPOVER_ID,
            view: {
                Component: Outline,
            },
            cbs: {
                onOpen: () => (outlineOpen = true),
                onClose: () => (outlineOpen = false),
            },
        }).toggle(event.target as Element);
    };

    $effect.pre(() => {
        if ($previewLeafStore) {
            file = $previewLeafStore.file;
            leaf = $previewLeafStore.leaf;
        }
    });

    onMount(() => {
        if (outlineBttn) {
            setIcon(outlineBttn, "lucide-list");
        }
    });
</script>

{#if file && leaf}
    <div class="flex space-x-1 pt-[1px] pb-1.5 px-3 h-[var(--header-height)]">
        <div
            tabindex="0"
            role="button"
            class={cn(
                "workspace-tab-header tappable cursor-pointer",
                outlineOpen && "is-active ",
            )}
            aria-label={`Outline of ${file.basename}`}
            data-tooltip-delay="300"
            data-tooltip-position="top"
            data-type="outline"
            id={`${BASE_POPOVER_ID}-outline-ref-el`}
            onclick={handleOutlineClick}
            onkeydown={handleOutlineClick}
        >
            <div class="workspace-tab-header-inner">
                <div
                    bind:this={outlineBttn}
                    class="workspace-tab-header-inner-icon"
                ></div>
                <div class="workspace-tab-header-inner-title">
                    Outline of {file.basename}
                </div>
            </div>
        </div>
    </div>
{/if}
