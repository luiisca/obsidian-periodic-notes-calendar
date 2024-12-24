<script lang="ts">
    import { BASE_POPOVER_ID } from "@/constants";
    import { settingsStore } from "@/settings";
    import { internalFileModStore, previewLeafStore } from "@/stores";
    import { cn } from "@/ui/utils";
    import { escapeRegex } from "@/utils";
    import { HeadingCache, setIcon, TFile, WorkspaceLeaf } from "obsidian";
    import { onMount } from "svelte";
    import { writable } from "svelte/store";
    import { slide } from "svelte/transition";
    import Node from "./Node.svelte";

    type TNode = HeadingCache & {
        parts?: string[];
        children: TNode[];
    };

    let file: TFile | null = $state(null);
    let leaf: WorkspaceLeaf | undefined | null = $state(null);

    let headings: HeadingCache[] | undefined = $derived.by(() => {
        $settingsStore;
        $internalFileModStore;
        if (file) {
            return window.app.metadataCache.getFileCache(file)?.headings;
        }
    });
    let searchQuery = $state("");
    let searchActive = $state(false);
    let collapseAll = writable<boolean | null>(null);
    let collapsedCount = $state(0);
    let allCollapsable = writable(true);
    let searchIcon: HTMLElement | undefined;
    let searchIcon2: HTMLElement | undefined;
    let collapseIcon: HTMLElement | undefined;
    let arrowIcon: HTMLElement | undefined;
    let searchInputEl: HTMLElement | undefined;

    // Build tree structure from flat headings array
    const tree = $derived.by(() => {
        const roots: TNode[] = [];
        const stack: TNode[] = [];

        headings &&
            headings.forEach((h) => {
                // each item is pushed to a stack that is checked iteratively from end to start in the next iteration for a parent (i.e. an item with a lower indentation level)
                // if a parent if found then the crr node is pushed to it
                // if no parent is found then the crr node is interpreted as a top-level item and pushed to root (where only top-level items are stored and all other items are stored as children of them)
                const node = { ...h, children: [] };
                // go one node back in every iteration until a stackNode.level < node.level (i.e. a parent) is found
                // or until all stack items have been removed
                while (
                    stack.length &&
                    stack[stack.length - 1].level >= node.level
                ) {
                    stack.pop();
                }

                // After the while loop, stack[stack.length - 1] (if it exists)
                // is guaranteed to be the closest parent
                if (stack.length) {
                    stack[stack.length - 1].children.push(node);
                } else {
                    // no elements left in stack, either crr node is new or no parent (i.e. an item with lower indentation level) found
                    roots.push(node);
                }
                stack.push(node);
            });

        return roots;
    });

    // Search functionality
    const filteredTree = $derived.by(() => {
        if (!searchQuery) return tree;

        function highlightMatches(text: string) {
            if (!searchQuery) return [text];

            const regex = new RegExp(`(${escapeRegex(searchQuery)})`, "gi");
            return text.split(regex);
        }

        const regex = new RegExp(searchQuery, "i");

        const isMatch = (node: TNode) => regex.test(node.heading);

        const filterTree = (nodes: TNode[]) => {
            return nodes.reduce((acc, node) => {
                if (isMatch(node)) {
                    const parts = highlightMatches(node.heading);
                    // Include the node and its children if it matches
                    acc.push({
                        ...node,
                        parts,
                        children: node.children
                            ? filterTree(node.children)
                            : [],
                    });
                } else if (node.children && node.children.length > 0) {
                    // Check children for matches
                    const filteredChildren = filterTree(node.children);
                    if (filteredChildren.length > 0) {
                        // Include the node if any children match
                        acc.push({
                            ...node,
                            children: filteredChildren,
                        });
                    }
                }
                return acc;
            }, [] as TNode[]);
        };

        return filterTree(tree);
    });

    const updateCollapsedCount = (collapsed: boolean) => {
        collapsedCount = collapsedCount + (collapsed ? 1 : -1);
        if (
            collapsedCount ===
            filteredTree.filter((n) => n.children.length > 0).length
        ) {
            allCollapsable.set(false);
        } else {
            allCollapsable.set(true);
        }
        collapseAll.set(null);
    };

    const handleSearchIconClick = () => {
        searchActive = !searchActive;
        if (searchActive) {
            searchInputEl?.focus();
        }
        searchQuery = "";
    };

    const handleClearSearchIconClick = () => {
        searchQuery = "";
        if (searchActive) {
            searchInputEl?.focus();
        }
    };

    const handleCollapseAllClick = () => {
        if ($allCollapsable) {
            collapsedCount = filteredTree.filter(
                (n) => n.children.length > 0,
            ).length;
        } else {
            collapsedCount = 0;
        }
        collapseAll.set($allCollapsable);
        allCollapsable.set(!$allCollapsable);
    };

    $effect(() => {
        if (collapseIcon) {
            setIcon(
                collapseIcon,
                $allCollapsable
                    ? "lucide-chevrons-down-up"
                    : "lucide-chevrons-up-down",
            );
        }
    });

    $effect.pre(() => {
        if ($previewLeafStore) {
            const filepath = $previewLeafStore.filepath;
            if (filepath) {
                file = window.app.vault.getAbstractFileByPath(
                    filepath,
                ) as TFile | null;
            }
            leaf = $previewLeafStore.leaf;
        }
    });

    onMount(() => {
        if (searchIcon) {
            setIcon(searchIcon, "lucide-search");
        }
        if (searchIcon2) {
            setIcon(searchIcon2, "lucide-search");
        }
        if (collapseIcon) {
            setIcon(collapseIcon, "lucide-chevrons-down-up");
        }
        if (arrowIcon) {
            setIcon(arrowIcon, "chevron-right");
        }
    });
</script>

<div
    class="bg-transparent z-[var(--layer-menu)] w-max opacity-0 pointer-events-none absolute top-0 left-0"
    data-popover={true}
    id={BASE_POPOVER_ID}
>
    <div
        class="w-[clamp(320px,_35vw,_500px)] [border:1px_solid_var(--background-modifier-border-hover)] bg-[var(--background-secondary)] rounded-[var(--radius-m)] [box-shadow:var(--shadow-s)] p-[var(--size-2-3)]"
    >
        <div class="nav-header">
            <div class="nav-buttons-container">
                <div
                    tabindex="0"
                    role="button"
                    bind:this={searchIcon}
                    class={cn(
                        "clickable-icon nav-action-button",
                        searchActive && "is-active",
                    )}
                    aria-label="Show search filter"
                    onclick={handleSearchIconClick}
                    onkeydown={handleSearchIconClick}
                ></div>
                <div
                    tabindex="0"
                    role="button"
                    bind:this={collapseIcon}
                    class={cn("clickable-icon nav-action-button")}
                    aria-label={$allCollapsable ? "Collapse all" : "Expand all"}
                    onclick={handleCollapseAllClick}
                    onkeydown={handleCollapseAllClick}
                ></div>
            </div>
            <div
                class={cn(
                    "search-input-container",
                    !searchActive && "opacity-0 h-0",
                )}
            >
                <div
                    bind:this={searchIcon2}
                    class={cn(
                        "absolute [top:calc((var(--input-height)-var(--search-icon-size))/2)] left-[var(--size-4-2)] h-[var(--search-icon-size)] w-[var(--search-icon-size)]",
                        searchActive && "is-active",
                    )}
                ></div>
                <input
                    enterkeyhint="search"
                    type="search"
                    spellcheck="false"
                    placeholder="Search..."
                    bind:this={searchInputEl}
                    bind:value={searchQuery}
                />
                <div
                    tabindex="0"
                    role="button"
                    class="search-input-clear-button"
                    aria-label="Clear search"
                    onclick={handleClearSearchIconClick}
                    onkeydown={handleClearSearchIconClick}
                ></div>
            </div>
        </div>
        {#if filteredTree.length > 0}
            {#each filteredTree as node}
                <div transition:slide={{ duration: 200 }}>
                    <Node
                        {node}
                        {searchQuery}
                        {collapseAll}
                        {updateCollapsedCount}
                    />
                </div>
            {/each}
        {:else}
            <div class="pane-empty">No headings found.</div>
        {/if}
    </div>
</div>
