<script lang="ts">
    import { cn } from "@/ui/utils";
    import { capitalize, isMobile } from "@/utils";
    import { getContext } from "svelte";

    interface Props {
        tabs?: string[];
        selectedTab: string;
        selectTab: (tab: string) => void;
        id?: string | undefined;
        tabId?: string | undefined;
        className?: string | null;
    }

    let {
        tabs = [],
        selectedTab = $bindable(),
        selectTab,
        id = undefined,
        tabId = undefined,
        className = null,
    }: Props = $props();

    let minimalMode = getContext("minimalMode") as
        | { value: boolean }
        | undefined;
</script>

<div
    class={cn(
        "flex rounded-[--tab-curve] mx-auto w-full max-w-64 p-1 bg-[--background-modifier-hover]",
        className,
    )}
    {id}
>
    {#each tabs as tab}
        <button
            class={cn(
                "cursor-pointer w-full rounded-[--radius-s] mr-1 last:mr-0 transition",
                selectedTab === tab
                    ? "!text-[--text-on-accent] !bg-[--interactive-accent] hover:!bg-[--interactive-accent-hover]"
                    : "!text-[--icon-color] opacity-[--icon-opacity] hover:opacity-[--icon-opacity-hover] hover:!text-[--icon-color-hover] hover:!bg-[--background-modifier-hover]",
                minimalMode?.value || isMobile()
                    ? "py-1 h-fit"
                    : "py-2 [font-size:100%]",
            )}
            id={tabId}
            onclick={() => selectTab(tab)}>{capitalize(tab)}</button
        >
    {/each}
</div>
