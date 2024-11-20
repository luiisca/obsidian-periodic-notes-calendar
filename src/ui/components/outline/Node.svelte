<script lang="ts">
    import { BASE_POPOVER_ID } from "@/constants";
    import { previewLeafStore } from "@/stores";
    import { getPopoverInstance } from "@/ui/popovers";
    import { cn } from "@/ui/utils";
    import { escapeRegex } from "@/utils";
    import { HeadingCache, MarkdownView, WorkspaceLeaf } from "obsidian";
    import { cubicOut } from "svelte/easing";
    import { tweened } from "svelte/motion";
    import { Writable } from "svelte/store";
    import Node from "./Node.svelte";

    interface Props {
        node: TNode;
        searchQuery: string;
        collapseAll: Writable<boolean | null>;
        updateCollapsedCount: (collapsed: boolean) => void;
        depth?: number;
    }
    type TNode = HeadingCache & {
        parts?: string[];
        children: TNode[];
    };
    let { node, searchQuery, collapseAll, updateCollapsedCount, depth = 0 }: Props = $props();
    let leaf: WorkspaceLeaf | null = $state(null);
    let childrenContainerEl: HTMLDivElement | null = $state(null);
    let childrenContainerElHeight = tweened(0, {duration: 300, easing: cubicOut})

    let markdownView: MarkdownView | null = $state(null);
    let collapsed = $state($collapseAll);

    const handleNodeClick = (ev: MouseEvent | KeyboardEvent) => {
        ev.stopPropagation()

        const editor = markdownView?.editor as unknown as CodeMirror.Editor | undefined;
        const headingLine = editor ? findHeadingLine(editor, `${'#'.repeat(node.level)} ${node.heading}`) : -1;
        getPopoverInstance(BASE_POPOVER_ID)?.close();

        leaf?.setViewState({
            type: "markdown",
            active: true
        })

        if (headingLine === -1) return;
        editor?.setCursor(headingLine, 0, { scroll: true });
        // editor.scrollIntoView({ from: { line: headingLine, ch: 0 }, to: { line: headingLine + 1, ch: 0 } });
    }

    const findHeadingLine = (editor: CodeMirror.Editor, heading: string): number => {
        const lines = editor.lineCount();
        for (let i = 0; i < lines; i++) {
            const regex = new RegExp(`${escapeRegex(heading)}$`);
            if (regex.test(editor.getLine(i).trim())) {
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
        if (childrenContainerEl) {
            childrenContainerElHeight.set(collapsed ? 0 : childrenContainerEl.scrollHeight)
        }
    })
    $effect(() => {
        if (typeof $collapseAll === "boolean") {
            collapsed = $collapseAll
        }
    })
    $effect.pre(() => {
        if ($previewLeafStore) {
            leaf = $previewLeafStore.leaf;
            if (leaf) {
                markdownView = leaf.view as MarkdownView
            }
        }
    });
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
        <div class={cn(
            "grid overflow-hidden [transition:grid-template-rows_200ms]",
            collapsed ? "grid-rows-[0fr]" : "grid-rows-[1fr]",
        )}>
            <div 
              bind:this={childrenContainerEl} 
              class={cn(
                  "tree-item-children min-h-0  [transition:visibility_200ms]", 
                  collapsed ? "[visibility:hidden]" : "visible"
              )}
            >
            {#each node.children as child}
                <Node
                    node={child}
                    {searchQuery}
                    {collapseAll}
                    {updateCollapsedCount}
                    depth={depth + 1}
                />
            {/each}
            </div>
        </div>
    {/if}
</div>
