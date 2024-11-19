<script lang="ts">
    import { BASE_POPOVER_ID } from "@/constants";
    import { settingsStore } from "@/settings";
    import { internalFileModStore } from "@/stores";
    import { HeadingCache, MarkdownView, setIcon, TFile, WorkspaceLeaf } from "obsidian";
    import { onMount } from "svelte";
    import { getPopoverInstance, Popover } from "../popovers";
    import { escapeRegex } from "@/utils";

    interface Props {
        tree: Node[];
        previewLeaf: WorkspaceLeaf;
    }
    let { tree, previewLeaf }: Props = $props();
    let markdownView: MarkdownView = previewLeaf.view as MarkdownView;

    const handleNodeClick = (heading: string) => {
        const editor = markdownView.editor as unknown as CodeMirror.Editor;
        const headingLine = findHeadingLine(editor, heading);
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
</script>

{#snippet Node(node: Node, depth = 0)}
    <div 
        tabindex="0" 
        role="button" 
        class="tree-item" 
        onclick={(ev) => {
            ev.stopPropagation()
            handleNodeClick(node.heading)
        }} 
        onkeydown={(ev) => {
            ev.stopPropagation()
            handleNodeClick(node.heading)
        }} 
    >
        <div 
          class={cn(
            'tree-item-self is-clickable mod-collapsible cursor-pointer', 
          )}
          style={depth > 0 ? `margin-left: -${depth * 16}px; padding-left: calc(${(depth * 16) + 24}px);` : ''}
        >
            <div 
                class={cn(
                    "tree-item-icon collapse-icon",
                    collapsed && "is-collapsed",
                    (node.children && node.children.length > 0) ? "" : "!hidden"
                )}
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
          <div class="tree-item-children">
            {#each node.children as child}
                {@render Node(child, depth + 1)}
            {/each}
          </div>
        {/if}
      </div>
{/snippet}

{@render Node(node)}
