<script lang="ts">
    import { BASE_POPOVER_ID } from "@/constants";
    import { settingsStore } from "@/settings";
    import { internalFileModStore } from "@/stores";
    import { HeadingCache, MarkdownView, setIcon, TFile, WorkspaceLeaf } from "obsidian";
    import { onMount } from "svelte";
    import { escapeRegex } from "@/utils";
    import { getPopoverInstance } from "@/ui/popovers";
    import { cn } from "@/ui/utils";
    import Node from "./Node.svelte"
    import { Writable } from "svelte/store";
    import { slide } from "svelte/transition";

    interface Props {
        node: TNode;
        previewLeaf: WorkspaceLeaf;
        searchQuery: string;
        collapseAll: Writable<boolean | null>;
        updateCollapsedCount: (collapsed: boolean) => void;
        depth?: number;
    }
    type TNode = HeadingCache & {
        parts?: string[];
        children: TNode[];
    };
    let { node, previewLeaf, searchQuery, collapseAll, updateCollapsedCount, depth = 0 }: Props = $props();
    let markdownView: MarkdownView = previewLeaf.view as MarkdownView;
    let collapsed = $state($collapseAll);

    const handleNodeClick = (ev: MouseEvent | KeyboardEvent) => {
        ev.stopPropagation()

        const editor = markdownView.editor as unknown as CodeMirror.Editor;
        const headingLine = findHeadingLine(editor, node.heading);
        getPopoverInstance(BASE_POPOVER_ID)?.close();

        previewLeaf.setViewState({
            type: "markdown",
            active: true
        })

        if (headingLine === -1) return;
        editor.setCursor(headingLine, 0, { scroll: true });
        // editor.scrollIntoView({ from: { line: headingLine, ch: 0 }, to: { line: headingLine + 1, ch: 0 } });
    }

    const findHeadingLine = (editor: CodeMirror.Editor, heading: string): number => {
        const lines = editor.lineCount();
        for (let i = 0; i < lines; i++) {
            if (editor.getLine(i).split(' ').slice(1).join('') === heading) {
                return i;
            }
        }
        return -1; // Heading not found
    }

    const handleCollapseClick = (ev: MouseEvent | KeyboardEvent) => {
        ev.stopPropagation();
        collapsed = !collapsed;
        depth === 0 && updateCollapsedCount(collapsed);
    }

    $effect(() => {
        if (typeof $collapseAll === "boolean") {
            collapsed = $collapseAll
        }
    })
</script>

{#snippet Heading(heading: string, parts: string[] | undefined)}
    {#if parts && parts.length > 0}
        {#each parts as part}
            {#if part.toLowerCase() === searchQuery.toLowerCase()}
                <span class="suggestion-highlight">{part}</span>
            {:else}
                {part}
            {/if}
        {/each}
    {:else}
        {heading}
    {/if}
{/snippet}

<div 
    tabindex="0" 
    role="button" 
    class="tree-item" 
    onclick={handleNodeClick} 
    onkeydown={handleNodeClick} 
>
    <div 
      class={cn(
        'tree-item-self is-clickable mod-collapsible cursor-pointer', 
      )}
      style={depth > 0 ? `margin-left: -${depth * 16}px; padding-left: calc(${(depth * 16) + 24}px);` : ''}
    >
        <div 
            tabindex="0" 
            role="button" 
            class={cn(
                "tree-item-icon collapse-icon",
                collapsed && "is-collapsed",
                (node.children && node.children.length > 0) ? "" : "!hidden"
            )}
            onclick={handleCollapseClick}
            onkeydown={handleCollapseClick}
        >
            <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor" 
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="svg-icon right-triangle"
            >
                <path d="M3 8L12 17L21 8"></path>
            </svg>
        </div>
        <div class="tree-item-inner">
            {@render Heading(node.heading, node.parts)}
        </div>
    </div>
    {#if node.children && node.children.length > 0}
      <div class={cn("tree-item-children", collapsed && "!hidden")} transition:slide={{ duration: 200}}>
        {#each node.children as child}
            <Node
                node={child}
                {previewLeaf}
                {searchQuery}
                {collapseAll}
                {updateCollapsedCount}
                depth={depth + 1}
            />
        {/each}
      </div>
    {/if}
  </div>
