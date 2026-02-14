<script lang="ts">
  import {
    BASE_POPOVER_ID,
    FILE_MENU_POPOVER_ID,
    PREVIEW_CONTROLS_TYPE,
  } from "@/constants";
  import {
    createNote,
    getFileData,
    getPeriodicityFromGranularity,
    IGranularity,
  } from "@/io";
  import { settingsStore } from "@/settings";
  import { previewLeafStore, todayStore } from "@/stores";
  import { ViewManager } from "@/ui";
  import { Button } from "@/ui/components/core";
  import { Popover } from "@/ui/popovers";
  import { createBasePopover, createFileMenuPopover } from "@/ui/popovers/base";
  import { cn, getSticker } from "@/ui/utils";
  import { capitalize } from "@/utils";
  import { MarkdownView, setIcon, TFile, WorkspaceLeaf } from "obsidian";
  import { Dot } from "../core";
  import { Outline } from "./outline";
  import { isValidPeriodicNote } from "@/io/validation";
  import { addExtraItems } from "./utils";
  import { PluginService } from "@/app-service";

  interface Props {
    date: moment.Moment;
  }
  const { date }: Props = $props();

  let file: TFile | null = $state(null);
  let leaf: WorkspaceLeaf | undefined | null = $state(null);
  let markdownView: MarkdownView | null = $state(null);
  let outlineBttn: HTMLElement | null = $state(null);
  let moreEl: HTMLElement | null = $state(null);
  let outlineOpen = $state(false);
  let enabledGranularities = $derived(
    $settingsStore.preview.enabledGranularities,
  );
  let crrGranularity = $derived($settingsStore.preview.crrGranularity);

  const handleOutlineClick = (event: MouseEvent | KeyboardEvent) => {
    // avoid this click triggering click listener added by popover
    event.stopPropagation();

    createBasePopover({
      view: {
        Component: Outline,
      },
      cbs: {
        onOpen: () => (outlineOpen = true),
        onClose: () => (outlineOpen = false),
      },
    }).toggle(event.target as Element);
  };
  const handleMoreClick = (event: MouseEvent) => {
    const tags = file
      ? PluginService.getPlugin()?.app.metadataCache.getFileCache(file)?.tags
      : null;
    const sticker = getSticker(tags);

    const crrActiveLeaf =
      PluginService.getPlugin()?.app.workspace.getActiveViewOfType(
        MarkdownView,
      )?.leaf;
    const crrActiveLeafId = (crrActiveLeaf as any)?.id as string | null;
    const previewLeafId = ($previewLeafStore?.leaf as any)?.id as string | null;
    const crrActiveLeafIsPreview =
      crrActiveLeafId && previewLeafId && crrActiveLeafId === previewLeafId;
    createFileMenuPopover().open({
      event,
      date,
      fileData: { file, sticker },
      extraItems:
        crrActiveLeafIsPreview && $previewLeafStore?.filepath === file?.path
          ? {
              add: addExtraItems,
              newSections: ["preview"],
            }
          : undefined,
    });
  };

  const handleDotClick = async (granularity: IGranularity) => {
    if (granularity === $settingsStore.preview.crrGranularity) return;

    settingsStore.update((s) => {
      s.preview.crrGranularity = granularity;
      return s;
    });

    const foundFile = getFileData(granularity, $todayStore).file;
    let file = foundFile;
    if (!foundFile) {
      file = (await createNote(granularity, $todayStore)) ?? null;
    }
    const data = await ViewManager.getPreviewFileData();
    const previewLeaf =
      $previewLeafStore?.leaf || ViewManager.searchPreviewLeaf();
    file &&
      previewLeaf &&
      ViewManager.setupOpenPreviewLeaf({
        file,
        granularity: data.granularity,
        date: data.date,
        previewLeaf,
      });
  };

  $effect.pre(() => {
    if ($previewLeafStore) {
      const filepath = $previewLeafStore.filepath;
      if (filepath) {
        const abstractFile =
          PluginService.getPlugin()?.app.vault.getAbstractFileByPath(filepath);
        if (abstractFile instanceof TFile) {
          file = abstractFile;
        }
      }
      leaf = $previewLeafStore.leaf;
      if (leaf) {
        markdownView = leaf.view as MarkdownView;
      }

      // set granularity to null in case a non-periodic file is opened in preview leaf
      if (file) {
        const { granularity } = isValidPeriodicNote(file.basename);
        if (!granularity) {
          settingsStore.update((s) => {
            s.preview.crrGranularity = null;
            return s;
          });
        }
      }
    }
  });
  $effect.pre(() => {
    if (outlineBttn) {
      setIcon(outlineBttn, "lucide-list");
    }
    if (moreEl) {
      setIcon(moreEl, "lucide-more-vertical");
    }
  });
</script>

{#snippet OutlineBttn()}
  {#if !$settingsStore.preview.zenMode && file}
    <div
      tabindex="0"
      role="button"
      class={cn(
        "preview-controls-button",
        "clickable-icon view-action cursor-[var(--cursor)] !transition-none",
      )}
      aria-label={`Outline of ${file.basename}`}
      data-tooltip-delay="200"
      data-type="outline"
      id="preview-controls-outline-bttn"
      onclick={handleOutlineClick}
      onkeydown={handleOutlineClick}
    >
      <div class="workspace-tab-header-inner !p-0 after:!hidden">
        <div
          bind:this={outlineBttn}
          class="workspace-tab-header-inner-icon !p-0"
        ></div>
      </div>
    </div>
  {/if}
{/snippet}
{#snippet MoreBttn()}
  {#if $previewLeafStore?.splitPos !== "root"}
    <Button
      id="preview-controls-more-bttn"
      class={cn(
        "preview-controls-button",
        "clickable-icon view-action ml-0 cursor-[var(--cursor)]",
      )}
      bind:this={moreEl}
      aria-label="More options"
      data-tooltip-delay="200"
      onclick={handleMoreClick}
    ></Button>
  {/if}
{/snippet}

<div id="pnc-container" data-type={PREVIEW_CONTROLS_TYPE}>
  {#if file && leaf}
    {#if !$settingsStore.timeline.enabled && $previewLeafStore?.splitPos !== "root"}
      <div
        id="preview-controls-container-up"
        class="absolute right-0 top-0 flex space-x-1 pb-1.5 mt-1.5 px-3 h-[var(--header-height)]"
      >
        {@render OutlineBttn()}
        {@render MoreBttn()}
      </div>
    {/if}
    <div
      id="preview-controls-container-side"
      class={cn(
        "absolute top-1/2 [transform:translateY(-50%)] flex flex-col gap-y-1 opacity-80 items-center right-1",
      )}
    >
      {#if $settingsStore.timeline.enabled || $previewLeafStore?.splitPos === "root"}
        {@render OutlineBttn()}
      {/if}
      {#if !$settingsStore.preview.zenMode && enabledGranularities}
        <div id="preview-controls-granularities">
          {#each enabledGranularities as g}
            <div
              id="preview-controls-granularity"
              tabindex="0"
              role="button"
              class="cursor-[var(--cursor)] px-1.5"
              onclick={() => handleDotClick(g)}
              onkeydown={() => handleDotClick(g)}
              aria-label={`${capitalize(getPeriodicityFromGranularity(g))} preview`}
            >
              <Dot
                isFilled={g === crrGranularity}
                className="w-1.5 h-1.5 m-0"
              />
            </div>
          {/each}
        </div>
      {/if}
      {#if $settingsStore.timeline.enabled || $previewLeafStore?.splitPos === "root"}
        {@render MoreBttn()}
      {/if}
    </div>
  {/if}
</div>
