<script lang="ts">
  import { IGranularity, TFileData } from "@/io";
  import { cn, eventHandlers, isControlPressed } from "@/ui/utils";
  import { getContext, Snippet } from "svelte";
  import { Platform } from "obsidian";

  interface Props {
    leftDate?: moment.Moment | null;
    leftTitle?: {
      className?: string;
      granularity: IGranularity;
      fileData: TFileData;
      formatValue: string;
    } | null;

    rightDate?: moment.Moment | null;
    rightTitle?: {
      className?: string;
      granularity: IGranularity;
      fileData: TFileData;
      formatValue: string;
    } | null;

    leftTitleSnippet?: Snippet;
    rightTitleSnippet?: Snippet;
    bottomNavSnippet?: Snippet;
  }
  let {
    leftDate = null,
    leftTitle = null,
    rightDate = null,
    rightTitle = null,
    leftTitleSnippet,
    rightTitleSnippet,
    bottomNavSnippet,
  }: Props = $props();
  let minimalMode = getContext("minimalMode") as { value: boolean } | undefined;
</script>

<div
  id="header"
  class={cn(
    "flex flex-col",
    minimalMode?.value || Platform.isPhone ? "mt-4 mb-3" : "my-4",
  )}
>
  <div
    id="header-title"
    class={cn(
      "flex justify-between items-baseline",
      minimalMode?.value || Platform.isPhone ? "" : "mb-1.5",
    )}
  >
    <!-- left title -->
    {@render leftTitleSnippet?.()}
    {#if leftTitle && leftDate}
      <button
        class={cn(
          "h-auto font-semibold !text-[--color-text-header-title] hover:!shadow-[0px_0px_0_7px_var(--interactive-hover)] rounded-[2px] !p-0",
          minimalMode?.value || Platform.isPhone ? "text-xl" : "text-7xl",
        )}
        id={leftTitle.granularity}
        onclick={(event) =>
          eventHandlers.onClick({
            date: leftDate,
            createNewSplitLeaf: isControlPressed(event),
            granularity: leftTitle.granularity,
          })}
        oncontextmenu={(event) =>
          eventHandlers.onContextMenu({
            event,
            fileData: leftTitle.fileData,
            date: leftDate,
            granularity: leftTitle.granularity,
          })}
        onpointerenter={(event) => {
          eventHandlers.onHover({
            event,
            isControlPressed: isControlPressed(event),
            file: leftTitle.fileData.file,
          });
        }}
      >
        {leftDate.format(leftTitle.formatValue)}
      </button>
    {/if}
    <!-- right title -->
    {@render rightTitleSnippet?.()}
    {#if rightTitle && rightDate}
      <button
        class={cn(
          "h-auto !text-[--interactive-accent] font-medium hover:!shadow-[0px_0px_0px_6px_var(--interactive-hover)] rounded-[2px] !p-0",
          minimalMode?.value || Platform.isPhone ? "text-sm" : "text-lg",
        )}
        id={rightTitle.granularity}
        onclick={(event) =>
          eventHandlers.onClick({
            date: rightDate,
            createNewSplitLeaf: isControlPressed(event),
            granularity: rightTitle.granularity,
          })}
        oncontextmenu={(event) =>
          eventHandlers.onContextMenu({
            event,
            fileData: rightTitle.fileData,
            date: rightDate,
            granularity: rightTitle.granularity,
          })}
        onpointerenter={(event) => {
          eventHandlers.onHover({
            event,
            isControlPressed: isControlPressed(event),
            file: rightTitle.fileData.file,
          });
        }}
      >
        {rightDate.format(rightTitle.formatValue)}
      </button>
    {/if}
  </div>

  {@render bottomNavSnippet?.()}
</div>
